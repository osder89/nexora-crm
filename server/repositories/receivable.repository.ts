import type { PrismaDbClient } from "@/server/repositories/prisma";

export async function createCollectionLogRecord(
  db: PrismaDbClient,
  actor: { id: string; tenantId: string },
  input: {
    saleId: string;
    customerId: string | null;
    comment: string;
    nextContactAt: Date | null;
  },
) {
  return db.collectionLog.create({
    data: {
      tenantId: actor.tenantId,
      saleId: input.saleId,
      customerId: input.customerId,
      createdById: actor.id,
      comment: input.comment,
      nextContactAt: input.nextContactAt,
    },
  });
}

export async function findSaleForCollectionLog(db: PrismaDbClient, tenantId: string, saleId: string) {
  return db.sale.findUnique({
    where: {
      id_tenantId: {
        id: saleId,
        tenantId,
      },
    },
    select: {
      id: true,
      customerId: true,
    },
  });
}

export async function listReceivables(db: PrismaDbClient, tenantId: string) {
  return db.sale.findMany({
    where: {
      tenantId,
      deletedAt: null,
      balance: { gt: 0 },
    },
    include: {
      customer: true,
      seller: {
        select: {
          id: true,
          email: true,
        },
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
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    orderBy: { dueDate: "asc" },
  });
}
