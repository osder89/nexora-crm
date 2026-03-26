import { Prisma, SaleStatus, SaleType } from "@prisma/client";

import { ApplicationError } from "@/server/base/errors/application.error";
import { findActiveProductsByIds } from "@/server/repositories/inventory.repository";
import { prisma } from "@/server/repositories/prisma";
import {
  createInstallments,
  createInventoryMovement,
  createPaymentRecord,
  createSaleItems,
  createSaleRecord,
  decrementProductStock,
  findActiveCustomerById,
  findSaleForCancellation,
  findSaleForPayment,
  getSaleDetail,
  incrementSaleProductStock,
  listSales,
  markSaleCanceled,
} from "@/server/repositories/sale.repository";
import {
  applyPaymentToInstallments,
  buildInstallmentPlan,
  deriveSaleStatus,
  recalculateSaleBalance,
} from "@/server/services/sales.service";
import type { TenantActor } from "@/server/types/actor";

export type LowStockProductAlert = {
  id: string;
  name: string;
  stock: number;
  stockMin: number;
};

export async function createSale(
  actor: TenantActor,
  input: {
    customerId: string | null;
    notes: string | null;
    saleType: SaleType;
    requestedQuantities: Map<string, number>;
    cashMethod: import("@prisma/client").PaymentMethod;
    credit?: {
      initialPayment: number;
      installmentCount: number;
      installmentFrequencyDays: number;
      firstInstallmentDate: Date;
      initialPaymentMethod: import("@prisma/client").PaymentMethod;
    };
  },
) {
  return prisma.$transaction(async (tx) => {
    if (input.customerId) {
      const customer = await findActiveCustomerById(tx, actor.tenantId, input.customerId);

      if (!customer) {
        throw new ApplicationError("Cliente no encontrado o inactivo.", {
          code: "CUSTOMER_NOT_FOUND",
          statusCode: 404,
        });
      }
    }

    const uniqueProductIds = Array.from(input.requestedQuantities.keys());
    const products = await findActiveProductsByIds(tx, actor.tenantId, uniqueProductIds);

    if (products.length !== uniqueProductIds.length) {
      throw new ApplicationError("Uno o mas productos no existen en este tenant.", {
        code: "SALE_PRODUCT_NOT_FOUND",
        statusCode: 422,
      });
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const saleItemsData: Array<{
      productId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }> = [];

    let total = new Prisma.Decimal(0);

    for (const [productId, quantity] of input.requestedQuantities.entries()) {
      const product = productById.get(productId);

      if (!product || !product.isActive) {
        throw new ApplicationError("Hay productos inactivos o invalidos.", {
          code: "SALE_INVALID_PRODUCT",
          statusCode: 422,
        });
      }

      if (product.stock < quantity) {
        throw new ApplicationError(`Stock insuficiente para ${product.name}.`, {
          code: "SALE_INSUFFICIENT_STOCK",
          statusCode: 422,
        });
      }

      const subtotal = product.price.mul(quantity);
      total = total.add(subtotal);

      saleItemsData.push({
        productId,
        quantity,
        unitPrice: product.price,
        subtotal,
      });
    }

    if (total.lte(0)) {
      throw new ApplicationError("La venta no puede tener total cero.", {
        code: "SALE_INVALID_TOTAL",
        statusCode: 422,
      });
    }

    let saleData: {
      saleType: SaleType;
      total: Prisma.Decimal;
      balance: Prisma.Decimal;
      status: SaleStatus;
      dueDate: Date | null;
      installmentCount: number | null;
      installmentFrequencyDays: number | null;
      firstInstallmentDate: Date | null;
      paymentsToCreate: Array<{ amount: Prisma.Decimal; method: import("@prisma/client").PaymentMethod; note: string }>;
      installmentsToCreate: Array<{ installmentNumber: number; amount: Prisma.Decimal; dueDate: Date }>;
    } = {
      saleType: SaleType.CONTADO,
      total,
      balance: new Prisma.Decimal(0),
      status: SaleStatus.PAID,
      dueDate: null,
      installmentCount: null,
      installmentFrequencyDays: null,
      firstInstallmentDate: null,
      paymentsToCreate: [{ amount: total, method: input.cashMethod, note: "Pago contado" }],
      installmentsToCreate: [],
    };

    if (input.saleType === SaleType.CREDITO && input.credit) {
      const initialPaymentDecimal = new Prisma.Decimal(input.credit.initialPayment);
      const creditBalance = total.minus(initialPaymentDecimal);

      if (creditBalance.lte(0)) {
        throw new ApplicationError("Para credito, el saldo a financiar debe ser mayor a cero.", {
          code: "SALE_INVALID_CREDIT_BALANCE",
          statusCode: 422,
        });
      }

      const installments = buildInstallmentPlan(
        creditBalance,
        input.credit.installmentCount,
        input.credit.firstInstallmentDate,
        input.credit.installmentFrequencyDays,
      );

      const dueDate = installments[installments.length - 1]?.dueDate ?? input.credit.firstInstallmentDate;
      const status = deriveSaleStatus(creditBalance, dueDate);

      saleData = {
        saleType: SaleType.CREDITO,
        total,
        balance: creditBalance,
        status,
        dueDate,
        installmentCount: input.credit.installmentCount,
        installmentFrequencyDays: input.credit.installmentFrequencyDays,
        firstInstallmentDate: input.credit.firstInstallmentDate,
        paymentsToCreate:
          initialPaymentDecimal.gt(0)
            ? [{ amount: initialPaymentDecimal, method: input.credit.initialPaymentMethod, note: "Pago inicial credito" }]
            : [],
        installmentsToCreate: installments,
      };
    }

    const sale = await createSaleRecord(tx, actor, {
      customerId: input.customerId,
      saleType: saleData.saleType,
      installmentCount: saleData.installmentCount,
      installmentFrequencyDays: saleData.installmentFrequencyDays,
      firstInstallmentDate: saleData.firstInstallmentDate,
      total: saleData.total,
      balance: saleData.balance,
      status: saleData.status,
      dueDate: saleData.dueDate,
      notes: input.notes,
    });

    await createSaleItems(tx, actor, sale.id, saleItemsData);
    await createInstallments(tx, actor, sale.id, saleData.installmentsToCreate);

    const lowStockProducts: LowStockProductAlert[] = [];

    for (const item of saleItemsData) {
      const updatedProduct = await decrementProductStock(tx, actor, {
        productId: item.productId,
        quantity: item.quantity,
      });

      if (updatedProduct.stock <= updatedProduct.stockMin) {
        lowStockProducts.push({
          id: updatedProduct.id,
          name: updatedProduct.name,
          stock: updatedProduct.stock,
          stockMin: updatedProduct.stockMin,
        });
      }

      await createInventoryMovement(tx, actor, {
        productId: item.productId,
        saleId: sale.id,
        type: "OUT",
        quantity: item.quantity,
        reason: `Venta ${sale.id}`,
      });
    }

    for (const payment of saleData.paymentsToCreate) {
      await createPaymentRecord(tx, actor, {
        saleId: sale.id,
        amount: payment.amount,
        method: payment.method,
        note: payment.note,
        paidAt: new Date(),
      });

      if (saleData.saleType === SaleType.CREDITO) {
        await applyPaymentToInstallments(actor.tenantId, sale.id, payment.amount, actor.id, tx);
      }
    }

    if (saleData.saleType === SaleType.CREDITO) {
      await recalculateSaleBalance(actor.tenantId, sale.id, tx, actor.id);
    }

    return {
      sale,
      lowStockProducts,
    };
  });
}

export async function createPayment(
  actor: TenantActor,
  input: {
    saleId: string;
    amount: number;
    method: import("@prisma/client").PaymentMethod;
    note: string | null;
    paidAt: Date;
  },
) {
  return prisma.$transaction(async (tx) => {
    const sale = await findSaleForPayment(tx, actor.tenantId, input.saleId);

    if (!sale) {
      throw new ApplicationError("Venta no encontrada.", {
        code: "SALE_NOT_FOUND",
        statusCode: 404,
      });
    }

    if (sale.status === SaleStatus.CANCELED) {
      throw new ApplicationError("No se puede pagar una venta cancelada.", {
        code: "SALE_CANCELED",
        statusCode: 409,
      });
    }

    const amountDecimal = new Prisma.Decimal(input.amount);
    if (amountDecimal.gt(sale.balance)) {
      throw new ApplicationError("El pago excede el saldo pendiente.", {
        code: "PAYMENT_EXCEEDS_BALANCE",
        statusCode: 422,
      });
    }

    await createPaymentRecord(tx, actor, {
      saleId: input.saleId,
      amount: amountDecimal,
      method: input.method,
      note: input.note,
      paidAt: input.paidAt,
    });

    if (sale.saleType === SaleType.CREDITO) {
      await applyPaymentToInstallments(actor.tenantId, input.saleId, amountDecimal, actor.id, tx);
    }

    await recalculateSaleBalance(actor.tenantId, input.saleId, tx, actor.id);

    return sale;
  });
}

export async function cancelSale(actor: TenantActor, saleId: string, cancelReason: string | null) {
  return prisma.$transaction(async (tx) => {
    const sale = await findSaleForCancellation(tx, actor.tenantId, saleId);

    if (!sale) {
      throw new ApplicationError("Venta no encontrada.", {
        code: "SALE_NOT_FOUND",
        statusCode: 404,
      });
    }

    if (sale.status === SaleStatus.CANCELED) {
      throw new ApplicationError("La venta ya esta cancelada.", {
        code: "SALE_ALREADY_CANCELED",
        statusCode: 409,
      });
    }

    if (sale.status === SaleStatus.PAID) {
      throw new ApplicationError("No se puede cancelar una venta pagada.", {
        code: "SALE_ALREADY_PAID",
        statusCode: 409,
      });
    }

    if (sale.status !== SaleStatus.PENDING && sale.status !== SaleStatus.OVERDUE) {
      throw new ApplicationError("Solo se pueden cancelar ventas pendientes o vencidas.", {
        code: "SALE_INVALID_STATUS",
        statusCode: 409,
      });
    }

    if (sale.payments.length > 0) {
      throw new ApplicationError("No se puede cancelar una venta con pagos registrados.", {
        code: "SALE_HAS_PAYMENTS",
        statusCode: 409,
      });
    }

    for (const item of sale.items) {
      await incrementSaleProductStock(tx, actor, {
        productId: item.productId,
        quantity: item.quantity,
      });

      await createInventoryMovement(tx, actor, {
        productId: item.productId,
        saleId: sale.id,
        type: "IN",
        quantity: item.quantity,
        reason: buildCancellationReason(sale.id, cancelReason),
      });
    }

    await markSaleCanceled(tx, actor, sale.id, {
      status: SaleStatus.CANCELED,
      balance: new Prisma.Decimal(0),
      notes: appendCancellationNote(sale.notes, cancelReason),
    });

    return sale;
  });
}

export async function getSalesData(tenantId: string) {
  const sales = await listSales(prisma, tenantId);
  return { sales };
}

export async function getSaleDetailData(tenantId: string, saleId: string) {
  const sale = await getSaleDetail(prisma, tenantId, saleId);

  if (!sale) {
    throw new ApplicationError("Venta no encontrada.", {
      code: "SALE_NOT_FOUND",
      statusCode: 404,
    });
  }

  return sale;
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
