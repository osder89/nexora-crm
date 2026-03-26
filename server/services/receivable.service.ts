import { ApplicationError } from "@/server/base/errors/application.error";
import { prisma } from "@/server/repositories/prisma";
import { createCollectionLogRecord, findSaleForCollectionLog, listReceivables } from "@/server/repositories/receivable.repository";
import type { TenantActor } from "@/server/types/actor";

export async function createCollectionLog(
  actor: TenantActor,
  input: {
    saleId: string;
    comment: string;
    nextContactAt: Date | null;
  },
) {
  const sale = await findSaleForCollectionLog(prisma, actor.tenantId, input.saleId);

  if (!sale) {
    throw new ApplicationError("Venta no encontrada.", {
      code: "SALE_NOT_FOUND",
      statusCode: 404,
    });
  }

  return createCollectionLogRecord(prisma, actor, {
    saleId: input.saleId,
    customerId: sale.customerId,
    comment: input.comment,
    nextContactAt: input.nextContactAt,
  });
}

export async function getReceivablesData(tenantId: string) {
  const sales = await listReceivables(prisma, tenantId);

  return {
    sales,
  };
}
