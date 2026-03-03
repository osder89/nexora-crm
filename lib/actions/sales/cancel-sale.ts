"use server";

import { Prisma, SaleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { optionalText, requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function cancelSaleAction(formData: FormData) {
  const user = await requireTenantUser();

  const saleId = requiredText(formData, "saleId", "Venta invalida.");
  const cancelReason = optionalText(formData, "cancelReason");

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: {
        id: saleId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        notes: true,
        items: {
          where: { tenantId: user.tenantId },
          select: {
            productId: true,
            quantity: true,
          },
        },
        payments: {
          where: { tenantId: user.tenantId, deletedAt: null },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!sale) {
      throw new Error("Venta no encontrada.");
    }

    if (sale.status === SaleStatus.CANCELED) {
      throw new Error("La venta ya esta cancelada.");
    }

    if (sale.status === SaleStatus.PAID) {
      throw new Error("No se puede cancelar una venta pagada.");
    }

    if (sale.status !== SaleStatus.PENDING && sale.status !== SaleStatus.OVERDUE) {
      throw new Error("Solo se pueden cancelar ventas pendientes o vencidas.");
    }

    if (sale.payments.length > 0) {
      throw new Error("No se puede cancelar una venta con pagos registrados.");
    }

    for (const item of sale.items) {
      await tx.product.update({
        where: {
          id_tenantId: {
            id: item.productId,
            tenantId: user.tenantId,
          },
        },
        data: {
          stock: {
            increment: item.quantity,
          },
          updatedById: user.id,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId: user.tenantId,
          productId: item.productId,
          userId: user.id,
          saleId: sale.id,
          type: "IN",
          quantity: item.quantity,
          reason: buildCancellationReason(sale.id, cancelReason),
        },
      });
    }

    await tx.sale.update({
      where: {
        id_tenantId: {
          id: sale.id,
          tenantId: user.tenantId,
        },
      },
      data: {
        status: SaleStatus.CANCELED,
        balance: new Prisma.Decimal(0),
        updatedById: user.id,
        notes: appendCancellationNote(sale.notes, cancelReason),
      },
    });
  });

  revalidatePath("/app/sales");
  revalidatePath(`/app/sales/${saleId}`);
  revalidatePath("/app/dashboard");
  revalidatePath("/app/receivables");
  revalidatePath("/app/products");
}

function buildCancellationReason(saleId: string, reason: string | null) {
  const base = `Anulacion venta ${saleId}`;
  if (!reason) {
    return base;
  }

  return `${base}: ${reason}`;
}

function appendCancellationNote(existing: string | null, reason: string | null) {
  const cancellationText = reason ? `Venta cancelada. Motivo: ${reason}` : "Venta cancelada.";
  if (!existing) {
    return cancellationText;
  }

  return `${existing}\n${cancellationText}`;
}
