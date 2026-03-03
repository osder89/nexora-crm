"use server";

import { PurchaseStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { optionalText } from "@/lib/actions/helpers";
import { requiredPurchaseId } from "@/lib/actions/purchases/shared";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function cancelPurchaseAction(formData: FormData) {
  const user = await requireTenantUser([Role.ADMIN_EMPRESA]);
  const purchaseId = requiredPurchaseId(formData);
  const reason = optionalText(formData, "cancelReason");

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({
      where: {
        id: purchaseId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        notes: true,
      },
    });

    if (!purchase) {
      throw new Error("Compra no encontrada.");
    }

    if (purchase.status === PurchaseStatus.CANCELED) {
      throw new Error("La compra ya esta cancelada.");
    }

    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new Error("No se puede cancelar una compra ya recibida.");
    }

    await tx.purchase.update({
      where: {
        id_tenantId: {
          id: purchase.id,
          tenantId: user.tenantId,
        },
      },
      data: {
        status: PurchaseStatus.CANCELED,
        updatedById: user.id,
        notes: appendCancellationNote(purchase.notes, reason),
      },
    });
  });

  revalidatePath("/app/purchases/orders");
  revalidatePath("/app/purchases/receipts");
  revalidatePath(`/app/purchases/${purchaseId}`);
}

function appendCancellationNote(existing: string | null, reason: string | null) {
  const cancellationText = reason ? `Compra cancelada. Motivo: ${reason}` : "Compra cancelada.";
  if (!existing) {
    return cancellationText;
  }

  return `${existing}\n${cancellationText}`;
}
