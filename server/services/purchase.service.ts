import { Prisma, PurchaseStatus, Role } from "@prisma/client";

import { ApplicationError } from "@/server/base/errors/application.error";
import { decimalFromNumber } from "@/server/domain/purchases/shared";
import { incrementProductStock } from "@/server/repositories/inventory.repository";
import { findActiveProductsByIds } from "@/server/repositories/inventory.repository";
import { prisma } from "@/server/repositories/prisma";
import {
  createPurchaseRecord,
  createSupplierRecord,
  findActiveSupplierById,
  findPurchaseForCancellation,
  findPurchaseForReception,
  getPurchaseDetail,
  listPurchases,
  listSuppliers,
  markPurchaseCanceled,
  markPurchaseReceived,
} from "@/server/repositories/purchase.repository";
import type { TenantActor } from "@/server/types/actor";

export async function createSupplier(
  actor: TenantActor,
  input: {
    name: string;
    nit: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
  },
) {
  assertAdminActor(actor);
  return createSupplierRecord(prisma, actor, input);
}

export async function createPurchase(
  actor: TenantActor,
  input: {
    supplierId: string;
    expectedAt: Date | null;
    notes: string | null;
    requestedItems: Map<string, { quantity: number; unitCost: number }>;
  },
) {
  assertAdminActor(actor);

  return prisma.$transaction(async (tx) => {
    const supplier = await findActiveSupplierById(tx, actor.tenantId, input.supplierId);
    if (!supplier) {
      throw new ApplicationError("Proveedor no encontrado o inactivo.", {
        code: "SUPPLIER_NOT_FOUND",
        statusCode: 404,
      });
    }

    const productIds = Array.from(input.requestedItems.keys());
    const products = await findActiveProductsByIds(tx, actor.tenantId, productIds);

    if (products.length !== productIds.length) {
      throw new ApplicationError("Uno o mas productos no existen para este tenant.", {
        code: "PURCHASE_PRODUCT_NOT_FOUND",
        statusCode: 422,
      });
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const items: Array<{
      productId: string;
      quantity: number;
      unitCost: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }> = [];

    let total = new Prisma.Decimal(0);

    for (const [productId, item] of input.requestedItems.entries()) {
      const product = productMap.get(productId);
      if (!product || !product.isActive) {
        throw new ApplicationError("Hay productos inactivos o invalidos en la compra.", {
          code: "PURCHASE_INVALID_PRODUCT",
          statusCode: 422,
        });
      }

      const unitCost = decimalFromNumber(item.unitCost);
      const subtotal = unitCost.mul(item.quantity);
      total = total.add(subtotal);

      items.push({
        productId,
        quantity: item.quantity,
        unitCost,
        subtotal,
      });
    }

    if (total.lte(0)) {
      throw new ApplicationError("La compra no puede tener total cero.", {
        code: "PURCHASE_INVALID_TOTAL",
        statusCode: 422,
      });
    }

    return createPurchaseRecord(tx, actor, {
      supplierId: supplier.id,
      expectedAt: input.expectedAt,
      notes: input.notes,
      total,
      items,
    });
  });
}

export async function receivePurchase(actor: TenantActor, purchaseId: string) {
  assertAdminActor(actor);

  return prisma.$transaction(async (tx) => {
    const purchase = await findPurchaseForReception(tx, actor.tenantId, purchaseId);

    if (!purchase) {
      throw new ApplicationError("Compra no encontrada.", {
        code: "PURCHASE_NOT_FOUND",
        statusCode: 404,
      });
    }

    if (purchase.status === PurchaseStatus.CANCELED) {
      throw new ApplicationError("No se puede recibir una compra cancelada.", {
        code: "PURCHASE_ALREADY_CANCELED",
        statusCode: 409,
      });
    }

    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new ApplicationError("La compra ya fue recibida.", {
        code: "PURCHASE_ALREADY_RECEIVED",
        statusCode: 409,
      });
    }

    for (const item of purchase.items) {
      await incrementProductStock(tx, actor, {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId: actor.tenantId,
          productId: item.productId,
          userId: actor.id,
          type: "IN",
          quantity: item.quantity,
          reason: `Ingreso compra ${purchase.id} (${purchase.supplier?.name ?? "Sin proveedor"})`,
        },
      });
    }

    await markPurchaseReceived(tx, actor, purchase.id);

    return purchase;
  });
}

export async function cancelPurchase(actor: TenantActor, purchaseId: string, reason: string | null) {
  assertAdminActor(actor);

  return prisma.$transaction(async (tx) => {
    const purchase = await findPurchaseForCancellation(tx, actor.tenantId, purchaseId);

    if (!purchase) {
      throw new ApplicationError("Compra no encontrada.", {
        code: "PURCHASE_NOT_FOUND",
        statusCode: 404,
      });
    }

    if (purchase.status === PurchaseStatus.CANCELED) {
      throw new ApplicationError("La compra ya esta cancelada.", {
        code: "PURCHASE_ALREADY_CANCELED",
        statusCode: 409,
      });
    }

    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new ApplicationError("No se puede cancelar una compra ya recibida.", {
        code: "PURCHASE_ALREADY_RECEIVED",
        statusCode: 409,
      });
    }

    const notes = appendCancellationNote(purchase.notes, reason);
    await markPurchaseCanceled(tx, actor, purchase.id, notes);

    return purchase;
  });
}

export async function getPurchasesData(tenantId: string) {
  const [suppliers, purchases] = await Promise.all([listSuppliers(prisma, tenantId), listPurchases(prisma, tenantId)]);

  return {
    suppliers,
    purchases,
  };
}

export async function getPurchaseDetailData(tenantId: string, purchaseId: string) {
  const purchase = await getPurchaseDetail(prisma, tenantId, purchaseId);

  if (!purchase) {
    throw new ApplicationError("Compra no encontrada.", {
      code: "PURCHASE_NOT_FOUND",
      statusCode: 404,
    });
  }

  return purchase;
}

function appendCancellationNote(existing: string | null, reason: string | null) {
  const cancellationText = reason ? `Compra cancelada. Motivo: ${reason}` : "Compra cancelada.";
  if (!existing) {
    return cancellationText;
  }

  return `${existing}\n${cancellationText}`;
}

function assertAdminActor(actor: TenantActor) {
  if (actor.role !== Role.ADMIN_EMPRESA) {
    throw new ApplicationError("No autorizado.", {
      code: "AUTHORIZATION_ERROR",
      statusCode: 403,
    });
  }
}
