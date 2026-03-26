import type { PaymentMethod, Prisma, SaleStatus, SaleType } from "@prisma/client";

import type { PrismaDbClient } from "@/server/repositories/prisma";

export async function findActiveCustomerById(db: PrismaDbClient, tenantId: string, customerId: string) {
  return db.customer.findFirst({
    where: {
      id: customerId,
      tenantId,
      deletedAt: null,
      isActive: true,
    },
    select: { id: true },
  });
}

export async function createSaleRecord(
  db: Prisma.TransactionClient,
  actor: { id: string; tenantId: string },
  input: {
    customerId: string | null;
    saleType: SaleType;
    installmentCount: number | null;
    installmentFrequencyDays: number | null;
    firstInstallmentDate: Date | null;
    total: Prisma.Decimal;
    balance: Prisma.Decimal;
    status: SaleStatus;
    dueDate: Date | null;
    notes: string | null;
  },
) {
  return db.sale.create({
    data: {
      tenantId: actor.tenantId,
      customerId: input.customerId,
      sellerId: actor.id,
      saleType: input.saleType,
      installmentCount: input.installmentCount,
      installmentFrequencyDays: input.installmentFrequencyDays,
      firstInstallmentDate: input.firstInstallmentDate,
      total: input.total,
      balance: input.balance,
      status: input.status,
      dueDate: input.dueDate,
      notes: input.notes,
      createdById: actor.id,
      updatedById: actor.id,
    },
  });
}

export async function createSaleItems(
  db: Prisma.TransactionClient,
  actor: { tenantId: string },
  saleId: string,
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    subtotal: Prisma.Decimal;
  }>,
) {
  await db.saleItem.createMany({
    data: items.map((item) => ({
      tenantId: actor.tenantId,
      saleId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
  });
}

export async function createInstallments(
  db: Prisma.TransactionClient,
  actor: { id: string; tenantId: string },
  saleId: string,
  installments: Array<{ installmentNumber: number; amount: Prisma.Decimal; dueDate: Date }>,
) {
  if (installments.length === 0) {
    return;
  }

  await db.saleInstallment.createMany({
    data: installments.map((installment) => ({
      tenantId: actor.tenantId,
      saleId,
      installmentNumber: installment.installmentNumber,
      amount: installment.amount,
      dueDate: installment.dueDate,
      createdById: actor.id,
      updatedById: actor.id,
    })),
  });
}

export async function decrementProductStock(
  db: Prisma.TransactionClient,
  actor: { id: string; tenantId: string },
  params: { productId: string; quantity: number },
) {
  return db.product.update({
    where: {
      id_tenantId: {
        id: params.productId,
        tenantId: actor.tenantId,
      },
    },
    data: {
      stock: {
        decrement: params.quantity,
      },
      updatedById: actor.id,
    },
  });
}

export async function incrementSaleProductStock(
  db: Prisma.TransactionClient,
  actor: { id: string; tenantId: string },
  params: { productId: string; quantity: number },
) {
  return db.product.update({
    where: {
      id_tenantId: {
        id: params.productId,
        tenantId: actor.tenantId,
      },
    },
    data: {
      stock: {
        increment: params.quantity,
      },
      updatedById: actor.id,
    },
  });
}

export async function createInventoryMovement(
  db: Prisma.TransactionClient,
  actor: { id: string; tenantId: string },
  input: {
    productId: string;
    saleId?: string;
    type: "IN" | "OUT" | "ADJUST";
    quantity: number;
    reason: string;
  },
) {
  return db.inventoryMovement.create({
    data: {
      tenantId: actor.tenantId,
      productId: input.productId,
      userId: actor.id,
      saleId: input.saleId,
      type: input.type,
      quantity: input.quantity,
      reason: input.reason,
    },
  });
}

export async function createPaymentRecord(
  db: Prisma.TransactionClient,
  actor: { id: string; tenantId: string },
  input: {
    saleId: string;
    amount: Prisma.Decimal;
    method: PaymentMethod;
    note: string | null;
    paidAt: Date;
  },
) {
  return db.payment.create({
    data: {
      tenantId: actor.tenantId,
      saleId: input.saleId,
      createdById: actor.id,
      updatedById: actor.id,
      amount: input.amount,
      method: input.method,
      note: input.note,
      paidAt: input.paidAt,
    },
  });
}

export async function findSaleForPayment(db: Prisma.TransactionClient, tenantId: string, saleId: string) {
  return db.sale.findFirst({
    where: {
      id: saleId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      saleType: true,
      balance: true,
    },
  });
}

export async function findSaleForCancellation(db: Prisma.TransactionClient, tenantId: string, saleId: string) {
  return db.sale.findFirst({
    where: {
      id: saleId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      notes: true,
      items: {
        where: { tenantId },
        select: {
          productId: true,
          quantity: true,
        },
      },
      payments: {
        where: { tenantId, deletedAt: null },
        select: { id: true },
        take: 1,
      },
    },
  });
}

export async function markSaleCanceled(
  db: Prisma.TransactionClient,
  actor: { id: string; tenantId: string },
  saleId: string,
  input: { status: SaleStatus; balance: Prisma.Decimal; notes: string },
) {
  return db.sale.update({
    where: {
      id_tenantId: {
        id: saleId,
        tenantId: actor.tenantId,
      },
    },
    data: {
      status: input.status,
      balance: input.balance,
      updatedById: actor.id,
      notes: input.notes,
    },
  });
}

export async function listSales(db: PrismaDbClient, tenantId: string) {
  return db.sale.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    include: {
      customer: true,
      seller: true,
      payments: {
        where: { tenantId, deletedAt: null },
      },
      items: {
        where: { tenantId },
        include: { product: true },
      },
      installments: {
        where: { tenantId },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSaleDetail(db: PrismaDbClient, tenantId: string, saleId: string) {
  return db.sale.findFirst({
    where: {
      id: saleId,
      tenantId,
      deletedAt: null,
    },
    include: {
      customer: true,
      seller: true,
      items: {
        where: { tenantId },
        include: { product: true },
      },
      payments: {
        where: { tenantId, deletedAt: null },
        orderBy: { paidAt: "desc" },
      },
      installments: {
        where: { tenantId },
        orderBy: { installmentNumber: "asc" },
      },
      collectionLogs: {
        where: { tenantId },
        include: {
          createdBy: {
            select: { email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
