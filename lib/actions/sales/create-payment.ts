"use server";

import { Prisma, SaleStatus, SaleType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { optionalText, requiredNumber, requiredText } from "@/lib/actions/helpers";
import { normalizePaymentMethod } from "@/lib/actions/sales/shared";
import { prisma } from "@/lib/prisma";
import { applyPaymentToInstallments, recalculateSaleBalance } from "@/lib/services/sales";
import { requireTenantUser } from "@/lib/session";

export async function createPaymentAction(formData: FormData) {
  const user = await requireTenantUser();

  const saleId = requiredText(formData, "saleId", "Venta invalida.");
  const amount = requiredNumber(formData, "amount", "Monto invalido.");
  const method = normalizePaymentMethod(requiredText(formData, "method", "Metodo invalido."));
  const note = optionalText(formData, "note");
  const paidAtInput = optionalText(formData, "paidAt");

  if (amount <= 0) {
    throw new Error("El monto debe ser mayor a cero.");
  }

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
        saleType: true,
        balance: true,
      },
    });

    if (!sale) {
      throw new Error("Venta no encontrada.");
    }

    if (sale.status === SaleStatus.CANCELED) {
      throw new Error("No se puede pagar una venta cancelada.");
    }

    const amountDecimal = new Prisma.Decimal(amount);
    if (amountDecimal.gt(sale.balance)) {
      throw new Error("El pago excede el saldo pendiente.");
    }

    await tx.payment.create({
      data: {
        tenantId: user.tenantId,
        saleId,
        createdById: user.id,
        updatedById: user.id,
        amount: amountDecimal,
        method,
        note,
        paidAt: paidAtInput ? new Date(`${paidAtInput}T00:00:00`) : new Date(),
      },
    });

    if (sale.saleType === SaleType.CREDITO) {
      await applyPaymentToInstallments(user.tenantId, saleId, amountDecimal, user.id, tx);
    }

    await recalculateSaleBalance(user.tenantId, saleId, tx, user.id);
  });

  revalidatePath("/app/sales");
  revalidatePath(`/app/sales/${saleId}`);
  revalidatePath("/app/dashboard");
  revalidatePath("/app/receivables");
}
