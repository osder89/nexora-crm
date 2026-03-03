"use server";

import { PurchaseStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requiredPurchaseId } from "@/lib/actions/purchases/shared";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function receivePurchaseAction(formData: FormData) {
  const user = await requireTenantUser([Role.ADMIN_EMPRESA]);
  const purchaseId = requiredPurchaseId(formData);

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({
      where: {
        id: purchaseId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      include: {
        supplier: { select: { name: true } },
        items: {
          where: {
            tenantId: user.tenantId,
            deletedAt: null,
          },
          select: {
            productId: true,
            quantity: true,
            unitCost: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new Error("Compra no encontrada.");
    }

    if (purchase.status === PurchaseStatus.CANCELED) {
      throw new Error("No se puede recibir una compra cancelada.");
    }

    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new Error("La compra ya fue recibida.");
    }

    for (const item of purchase.items) {
      await tx.product.update({
        where: {
          id_tenantId: {
            id: item.productId,
            tenantId: user.tenantId,
          },
        },
        data: {
          stock: { increment: item.quantity },
          cost: item.unitCost,
          updatedById: user.id,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId: user.tenantId,
          productId: item.productId,
          userId: user.id,
          type: "IN",
          quantity: item.quantity,
          reason: `Ingreso compra ${purchase.id} (${purchase.supplier?.name ?? "Sin proveedor"})`,
        },
      });
    }

    await tx.purchase.update({
      where: {
        id_tenantId: {
          id: purchase.id,
          tenantId: user.tenantId,
        },
      },
      data: {
        status: PurchaseStatus.RECEIVED,
        receivedAt: new Date(),
        updatedById: user.id,
      },
    });
  });

  revalidatePath("/app/purchases/orders");
  revalidatePath("/app/purchases/receipts");
  revalidatePath(`/app/purchases/${purchaseId}`);
  revalidatePath("/app/products");
  revalidatePath("/app/dashboard");
}
