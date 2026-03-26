import { InstallmentStatus, Prisma, SaleStatus } from "@prisma/client";

import { prisma } from "@/server/repositories/prisma";
import { startOfDay } from "@/shared/lib/utils";

export function deriveSaleStatus(balance: Prisma.Decimal, dueDate: Date | null): SaleStatus {
  if (balance.lte(0)) {
    return SaleStatus.PAID;
  }

  if (!dueDate) {
    return SaleStatus.PENDING;
  }

  const today = startOfDay();
  if (dueDate < today) {
    return SaleStatus.OVERDUE;
  }

  return SaleStatus.PENDING;
}

export function deriveInstallmentStatus(balance: Prisma.Decimal, dueDate: Date): InstallmentStatus {
  if (balance.lte(0)) {
    return InstallmentStatus.PAID;
  }

  return dueDate < startOfDay() ? InstallmentStatus.OVERDUE : InstallmentStatus.PENDING;
}

export function buildInstallmentPlan(balance: Prisma.Decimal, installmentCount: number, firstInstallmentDate: Date, frequencyDays: number) {
  const balanceInCents = Math.round(Number(balance) * 100);
  const baseCents = Math.floor(balanceInCents / installmentCount);
  const remainder = balanceInCents - baseCents * installmentCount;

  return Array.from({ length: installmentCount }, (_, index) => {
    const cents = baseCents + (index < remainder ? 1 : 0);
    const dueDate = new Date(firstInstallmentDate);
    dueDate.setDate(firstInstallmentDate.getDate() + frequencyDays * index);

    return {
      installmentNumber: index + 1,
      amount: new Prisma.Decimal((cents / 100).toFixed(2)),
      dueDate,
    };
  });
}

export async function refreshInstallmentStatuses(tenantId: string, saleId: string, userId: string, tx: Prisma.TransactionClient) {
  const installments = await tx.saleInstallment.findMany({
    where: {
      tenantId,
      saleId,
    },
    orderBy: { installmentNumber: "asc" },
  });

  for (const installment of installments) {
    const balance = installment.amount.minus(installment.paidAmount);
    const nextStatus = deriveInstallmentStatus(balance, installment.dueDate);

    if (nextStatus !== installment.status) {
      await tx.saleInstallment.update({
        where: { id_tenantId: { id: installment.id, tenantId } },
        data: {
          status: nextStatus,
          updatedById: userId,
        },
      });
    }
  }
}

export async function applyPaymentToInstallments(
  tenantId: string,
  saleId: string,
  amount: Prisma.Decimal,
  userId: string,
  tx: Prisma.TransactionClient,
) {
  let remaining = amount;

  const installments = await tx.saleInstallment.findMany({
    where: {
      tenantId,
      saleId,
      status: { in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE] },
    },
    orderBy: { installmentNumber: "asc" },
  });

  for (const installment of installments) {
    if (remaining.lte(0)) {
      break;
    }

    const installmentBalance = installment.amount.minus(installment.paidAmount);
    if (installmentBalance.lte(0)) {
      continue;
    }

    const applied = remaining.greaterThan(installmentBalance) ? installmentBalance : remaining;
    const nextPaidAmount = installment.paidAmount.add(applied);
    const nextBalance = installment.amount.minus(nextPaidAmount);
    const nextStatus = deriveInstallmentStatus(nextBalance, installment.dueDate);

    await tx.saleInstallment.update({
      where: { id_tenantId: { id: installment.id, tenantId } },
      data: {
        paidAmount: nextPaidAmount,
        status: nextStatus,
        updatedById: userId,
      },
    });

    remaining = remaining.minus(applied);
  }
}

export async function recalculateSaleBalance(tenantId: string, saleId: string, tx?: Prisma.TransactionClient, userId?: string) {
  const db = tx ?? prisma;

  const sale = await db.sale.findFirst({
    where: { id: saleId, tenantId, deletedAt: null },
    select: { id: true, total: true, dueDate: true, status: true },
  });

  if (!sale) {
    throw new Error("Venta no encontrada.");
  }

  const payments = await db.payment.aggregate({
    where: { tenantId, saleId, deletedAt: null },
    _sum: { amount: true },
  });

  const paidAmount = payments._sum.amount ?? new Prisma.Decimal(0);
  const rawBalance = sale.total.minus(paidAmount);
  const balance = rawBalance.gte(0) ? rawBalance : new Prisma.Decimal(0);
  const status = deriveSaleStatus(balance, sale.dueDate ?? null);

  await db.sale.update({
    where: { id_tenantId: { id: saleId, tenantId } },
    data: {
      balance,
      status,
    },
  });

  if (tx && userId) {
    await refreshInstallmentStatuses(tenantId, saleId, userId, tx);
  }
}
