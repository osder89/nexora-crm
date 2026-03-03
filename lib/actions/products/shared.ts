import { Prisma } from "@prisma/client";

import { optionalText, requiredInt, requiredNumber, requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";

export type ProductInput = {
  name: string;
  sku: string | null;
  categoryId: string | null;
  cost: Prisma.Decimal | null;
  price: Prisma.Decimal;
  stockMin: number;
  isActive: boolean;
};

export function parseProductInput(formData: FormData): ProductInput {
  const name = requiredText(formData, "name", "El nombre es obligatorio.");
  const sku = optionalText(formData, "sku");
  const categoryId = optionalText(formData, "categoryId");
  const costText = optionalText(formData, "cost");
  const price = requiredNumber(formData, "price", "El precio es obligatorio.");
  const stockMin = requiredInt(formData, "stockMin", "El stock minimo debe ser entero.");

  return {
    name,
    sku,
    categoryId,
    cost: costText ? new Prisma.Decimal(costText) : null,
    price: new Prisma.Decimal(price),
    stockMin,
    isActive: String(formData.get("isActive") ?? "true") === "true",
  };
}

export function parseInitialStock(formData: FormData) {
  return requiredInt(formData, "stock", "El stock inicial debe ser entero.");
}

export async function assertUniqueProductSku(tenantId: string, sku: string | null, excludeProductId?: string) {
  if (!sku) {
    return;
  }

  const duplicate = await prisma.product.findFirst({
    where: {
      tenantId,
      sku,
      deletedAt: null,
      ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error("El SKU ya existe en este tenant.");
  }
}

export async function assertValidCategory(tenantId: string, categoryId: string | null) {
  if (!categoryId) {
    return;
  }

  const category = await prisma.productCategory.findFirst({
    where: {
      id: categoryId,
      tenantId,
      deletedAt: null,
      isActive: true,
    },
    select: { id: true },
  });

  if (!category) {
    throw new Error("Categoria invalida o inactiva.");
  }
}
