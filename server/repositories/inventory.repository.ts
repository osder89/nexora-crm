import type { Prisma } from "@prisma/client";

import type { PrismaDbClient } from "@/server/repositories/prisma";

export async function findActiveProductsByIds(db: PrismaDbClient, tenantId: string, productIds: string[]) {
  return db.product.findMany({
    where: {
      tenantId,
      id: { in: productIds },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      isActive: true,
    },
  });
}

export async function incrementProductStock(
  db: Prisma.TransactionClient,
  actor: { id: string; tenantId: string },
  params: { productId: string; quantity: number; unitCost: Prisma.Decimal },
) {
  return db.product.update({
    where: {
      id_tenantId: {
        id: params.productId,
        tenantId: actor.tenantId,
      },
    },
    data: {
      stock: { increment: params.quantity },
      cost: params.unitCost,
      updatedById: actor.id,
    },
  });
}
