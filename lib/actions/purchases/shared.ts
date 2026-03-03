import { Prisma } from "@prisma/client";

import { requiredText } from "@/lib/actions/helpers";

export function parsePurchaseItems(formData: FormData) {
  const productIds = formData
    .getAll("productId")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);

  const quantities = formData
    .getAll("quantity")
    .map((value) => (typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN));

  const unitCosts = formData
    .getAll("unitCost")
    .map((value) => (typeof value === "string" ? Number.parseFloat(value) : Number.NaN));

  if (productIds.length === 0 || productIds.length !== quantities.length || productIds.length !== unitCosts.length) {
    throw new Error("Debes registrar al menos un item de compra valido.");
  }

  const merged = new Map<string, { quantity: number; unitCost: number }>();

  for (let index = 0; index < productIds.length; index += 1) {
    const productId = productIds[index];
    const quantity = quantities[index];
    const unitCost = unitCosts[index];

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("La cantidad debe ser mayor a cero.");
    }

    if (!Number.isFinite(unitCost) || unitCost <= 0) {
      throw new Error("El costo unitario debe ser mayor a cero.");
    }

    if (merged.has(productId)) {
      const current = merged.get(productId)!;
      merged.set(productId, {
        quantity: current.quantity + quantity,
        unitCost,
      });
    } else {
      merged.set(productId, { quantity, unitCost });
    }
  }

  return merged;
}

export function requiredPurchaseId(formData: FormData) {
  return requiredText(formData, "purchaseId", "Compra invalida.");
}

export function decimalFromNumber(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}
