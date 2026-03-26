import type { Prisma } from "@prisma/client";

import type { PrismaDbClient } from "@/server/repositories/prisma";

export async function createSupplierRecord(
  db: PrismaDbClient,
  actor: { id: string; tenantId: string },
  input: {
    name: string;
    nit: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
  },
) {
  return db.supplier.create({
    data: {
      tenantId: actor.tenantId,
      name: input.name,
      nit: input.nit,
      phone: input.phone,
      email: input.email,
      address: input.address,
      notes: input.notes,
      createdById: actor.id,
      updatedById: actor.id,
    },
  });
}

export async function findActiveSupplierById(db: PrismaDbClient, tenantId: string, supplierId: string) {
  return db.supplier.findFirst({
    where: {
      id: supplierId,
      tenantId,
      deletedAt: null,
      isActive: true,
    },
    select: { id: true, name: true },
  });
}

export async function createPurchaseRecord(
  db: Prisma.TransactionClient,
  actor: { id: string; tenantId: string },
  input: {
    supplierId: string;
    expectedAt: Date | null;
    notes: string | null;
    total: Prisma.Decimal;
    items: Array<{
      productId: string;
      quantity: number;
      unitCost: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }>;
  },
) {
  const purchase = await db.purchase.create({
    data: {
      tenantId: actor.tenantId,
      supplierId: input.supplierId,
      status: "ORDERED",
      expectedAt: input.expectedAt,
      total: input.total,
      notes: input.notes,
      createdById: actor.id,
      updatedById: actor.id,
    },
    select: { id: true },
  });

  await db.purchaseItem.createMany({
    data: input.items.map((item) => ({
      tenantId: actor.tenantId,
      purchaseId: purchase.id,
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: item.subtotal,
      createdById: actor.id,
      updatedById: actor.id,
    })),
  });

  return purchase;
}

export async function findPurchaseForReception(db: Prisma.TransactionClient, tenantId: string, purchaseId: string) {
  return db.purchase.findFirst({
    where: {
      id: purchaseId,
      tenantId,
      deletedAt: null,
    },
    include: {
      supplier: { select: { name: true } },
      items: {
        where: {
          tenantId,
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
}

export async function findPurchaseForCancellation(db: Prisma.TransactionClient, tenantId: string, purchaseId: string) {
  return db.purchase.findFirst({
    where: {
      id: purchaseId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      notes: true,
    },
  });
}

export async function markPurchaseReceived(db: Prisma.TransactionClient, actor: { id: string; tenantId: string }, purchaseId: string) {
  return db.purchase.update({
    where: {
      id_tenantId: {
        id: purchaseId,
        tenantId: actor.tenantId,
      },
    },
    data: {
      status: "RECEIVED",
      receivedAt: new Date(),
      updatedById: actor.id,
    },
  });
}

export async function markPurchaseCanceled(
  db: Prisma.TransactionClient,
  actor: { id: string; tenantId: string },
  purchaseId: string,
  notes: string,
) {
  return db.purchase.update({
    where: {
      id_tenantId: {
        id: purchaseId,
        tenantId: actor.tenantId,
      },
    },
    data: {
      status: "CANCELED",
      updatedById: actor.id,
      notes,
    },
  });
}

export async function listSuppliers(db: PrismaDbClient, tenantId: string) {
  return db.supplier.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          purchases: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function listPurchases(db: PrismaDbClient, tenantId: string) {
  return db.purchase.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    include: {
      supplier: true,
      items: {
        where: {
          tenantId,
          deletedAt: null,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchaseDetail(db: PrismaDbClient, tenantId: string, purchaseId: string) {
  return db.purchase.findFirst({
    where: {
      id: purchaseId,
      tenantId,
      deletedAt: null,
    },
    include: {
      supplier: true,
      createdBy: {
        select: {
          email: true,
        },
      },
      items: {
        where: {
          tenantId,
          deletedAt: null,
        },
        include: {
          product: true,
        },
      },
    },
  });
}
