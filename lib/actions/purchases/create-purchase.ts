"use server";

import { Prisma, PurchaseStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { optionalText, requiredText } from "@/lib/actions/helpers";
import { decimalFromNumber, parsePurchaseItems } from "@/lib/actions/purchases/shared";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function createPurchaseAction(formData: FormData) {
  const user = await requireTenantUser([Role.ADMIN_EMPRESA]);

  const supplierId = requiredText(formData, "supplierId", "Proveedor invalido.");
  const notes = optionalText(formData, "notes");
  const expectedAtRaw = optionalText(formData, "expectedAt");
  const expectedAt = expectedAtRaw ? new Date(`${expectedAtRaw}T00:00:00`) : null;
  const requestedItems = parsePurchaseItems(formData);

  await prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findFirst({
      where: {
        id: supplierId,
        tenantId: user.tenantId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    if (!supplier) {
      throw new Error("Proveedor no encontrado o inactivo.");
    }

    const productIds = Array.from(requestedItems.keys());
    const products = await tx.product.findMany({
      where: {
        tenantId: user.tenantId,
        id: { in: productIds },
        deletedAt: null,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new Error("Uno o mas productos no existen para este tenant.");
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const itemsData: Array<{
      tenantId: string;
      productId: string;
      quantity: number;
      unitCost: Prisma.Decimal;
      subtotal: Prisma.Decimal;
      createdById: string;
      updatedById: string;
    }> = [];

    let total = new Prisma.Decimal(0);

    for (const [productId, item] of requestedItems.entries()) {
      const product = productMap.get(productId);
      if (!product || !product.isActive) {
        throw new Error("Hay productos inactivos o invalidos en la compra.");
      }

      const unitCost = decimalFromNumber(item.unitCost);
      const subtotal = unitCost.mul(item.quantity);
      total = total.add(subtotal);

      itemsData.push({
        tenantId: user.tenantId,
        productId,
        quantity: item.quantity,
        unitCost,
        subtotal,
        createdById: user.id,
        updatedById: user.id,
      });
    }

    if (total.lte(0)) {
      throw new Error("La compra no puede tener total cero.");
    }

    const purchase = await tx.purchase.create({
      data: {
        tenantId: user.tenantId,
        supplierId,
        status: PurchaseStatus.ORDERED,
        expectedAt,
        total,
        notes,
        createdById: user.id,
        updatedById: user.id,
      },
      select: { id: true },
    });

    await tx.purchaseItem.createMany({
      data: itemsData.map((item) => ({
        ...item,
        purchaseId: purchase.id,
      })),
    });
  });

  revalidatePath("/app/purchases/orders");
  revalidatePath("/app/purchases/receipts");
  revalidatePath("/app/products");
}
