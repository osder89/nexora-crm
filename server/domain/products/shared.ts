import { Prisma } from "@prisma/client";

import { optionalText, requiredInt, requiredNumber, requiredText } from "@/server/utils/form";

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
