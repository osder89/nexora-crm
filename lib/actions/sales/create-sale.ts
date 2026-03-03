"use server";

import { PaymentMethod, Prisma, SaleStatus, SaleType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { optionalText } from "@/lib/actions/helpers";
import { normalizePaymentMethod, parseCreditConfig, parseSaleItems, parseSaleType } from "@/lib/actions/sales/shared";
import { prisma } from "@/lib/prisma";
import { applyPaymentToInstallments, buildInstallmentPlan, deriveSaleStatus, recalculateSaleBalance } from "@/lib/services/sales";
import { requireTenantUser } from "@/lib/session";

export async function createSaleAction(formData: FormData) {
  const user = await requireTenantUser();

  const customerIdRaw = optionalText(formData, "customerId");
  const notes = optionalText(formData, "notes");
  const saleType = parseSaleType(formData);
  const requestedQuantities = parseSaleItems(formData);

  await prisma.$transaction(async (tx) => {
    if (customerIdRaw) {
      const customer = await tx.customer.findFirst({
        where: {
          id: customerIdRaw,
          tenantId: user.tenantId,
          deletedAt: null,
          isActive: true,
        },
        select: { id: true },
      });

      if (!customer) {
        throw new Error("Cliente no encontrado o inactivo.");
      }
    }

    const uniqueProductIds = Array.from(requestedQuantities.keys());
    const products = await tx.product.findMany({
      where: {
        tenantId: user.tenantId,
        id: { in: uniqueProductIds },
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

    if (products.length !== uniqueProductIds.length) {
      throw new Error("Uno o mas productos no existen en este tenant.");
    }

    const productById = new Map(products.map((product) => [product.id, product]));

    const saleItemsData: Array<{
      tenantId: string;
      productId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }> = [];

    let total = new Prisma.Decimal(0);

    for (const [productId, quantity] of requestedQuantities.entries()) {
      const product = productById.get(productId);

      if (!product || !product.isActive) {
        throw new Error("Hay productos inactivos o invalidos.");
      }

      if (product.stock < quantity) {
        throw new Error(`Stock insuficiente para ${product.name}.`);
      }

      const subtotal = product.price.mul(quantity);
      total = total.add(subtotal);

      saleItemsData.push({
        tenantId: user.tenantId,
        productId,
        quantity,
        unitPrice: product.price,
        subtotal,
      });
    }

    if (total.lte(0)) {
      throw new Error("La venta no puede tener total cero.");
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
      paymentsToCreate: Array<{ amount: Prisma.Decimal; method: PaymentMethod; note: string }>;
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
      paymentsToCreate: [{ amount: total, method: normalizePaymentMethod(optionalText(formData, "cashMethod")), note: "Pago contado" }],
      installmentsToCreate: [],
    };

    if (saleType === SaleType.CREDITO) {
      const credit = parseCreditConfig(formData);
      const initialPaymentDecimal = new Prisma.Decimal(credit.initialPayment);
      const creditBalance = total.minus(initialPaymentDecimal);

      if (creditBalance.lte(0)) {
        throw new Error("Para credito, el saldo a financiar debe ser mayor a cero.");
      }

      const installments = buildInstallmentPlan(
        creditBalance,
        credit.installmentCount,
        credit.firstInstallmentDate,
        credit.installmentFrequencyDays,
      );

      const dueDate = installments[installments.length - 1]?.dueDate ?? credit.firstInstallmentDate;
      const status = deriveSaleStatus(creditBalance, dueDate);

      saleData = {
        saleType: SaleType.CREDITO,
        total,
        balance: creditBalance,
        status,
        dueDate,
        installmentCount: credit.installmentCount,
        installmentFrequencyDays: credit.installmentFrequencyDays,
        firstInstallmentDate: credit.firstInstallmentDate,
        paymentsToCreate: initialPaymentDecimal.gt(0)
          ? [{ amount: initialPaymentDecimal, method: credit.initialPaymentMethod, note: "Pago inicial credito" }]
          : [],
        installmentsToCreate: installments,
      };
    }

    const sale = await tx.sale.create({
      data: {
        tenantId: user.tenantId,
        customerId: customerIdRaw,
        sellerId: user.id,
        saleType: saleData.saleType,
        installmentCount: saleData.installmentCount,
        installmentFrequencyDays: saleData.installmentFrequencyDays,
        firstInstallmentDate: saleData.firstInstallmentDate,
        total: saleData.total,
        balance: saleData.balance,
        status: saleData.status,
        dueDate: saleData.dueDate,
        notes,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    await tx.saleItem.createMany({
      data: saleItemsData.map((item) => ({
        ...item,
        saleId: sale.id,
      })),
    });

    if (saleData.installmentsToCreate.length > 0) {
      await tx.saleInstallment.createMany({
        data: saleData.installmentsToCreate.map((installment) => ({
          tenantId: user.tenantId,
          saleId: sale.id,
          installmentNumber: installment.installmentNumber,
          amount: installment.amount,
          dueDate: installment.dueDate,
          createdById: user.id,
          updatedById: user.id,
        })),
      });
    }

    for (const item of saleItemsData) {
      await tx.product.update({
        where: {
          id_tenantId: {
            id: item.productId,
            tenantId: user.tenantId,
          },
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
          updatedById: user.id,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId: user.tenantId,
          productId: item.productId,
          userId: user.id,
          saleId: sale.id,
          type: "OUT",
          quantity: item.quantity,
          reason: `Venta ${sale.id}`,
        },
      });
    }

    for (const payment of saleData.paymentsToCreate) {
      await tx.payment.create({
        data: {
          tenantId: user.tenantId,
          saleId: sale.id,
          createdById: user.id,
          updatedById: user.id,
          amount: payment.amount,
          method: payment.method,
          note: payment.note,
          paidAt: new Date(),
        },
      });

      if (saleData.saleType === SaleType.CREDITO) {
        await applyPaymentToInstallments(user.tenantId, sale.id, payment.amount, user.id, tx);
      }
    }

    if (saleData.saleType === SaleType.CREDITO) {
      await recalculateSaleBalance(user.tenantId, sale.id, tx, user.id);
    }
  });

  revalidatePath("/app/sales");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/receivables");
}
