import { PaymentMethod, SaleType } from "@prisma/client";

import { optionalText, requiredInt, requiredNumber, requiredText } from "@/lib/actions/helpers";

export function normalizePaymentMethod(value: string | null, fallback: PaymentMethod = PaymentMethod.CASH): PaymentMethod {
  if (!value) {
    return fallback;
  }

  if (value === PaymentMethod.CASH || value === PaymentMethod.TRANSFER || value === PaymentMethod.QR) {
    return value;
  }

  throw new Error("Metodo de pago invalido.");
}

export function parseSaleType(formData: FormData): SaleType {
  const rawType = requiredText(formData, "saleType", "Tipo de venta invalido.");

  if (rawType === SaleType.CONTADO || rawType === SaleType.CREDITO) {
    return rawType;
  }

  throw new Error("Tipo de venta invalido.");
}

export function parseSaleItems(formData: FormData) {
  const productIds = formData
    .getAll("productId")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);

  const rawQuantities = formData
    .getAll("quantity")
    .map((value) => (typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN));

  if (productIds.length === 0 || productIds.length !== rawQuantities.length) {
    throw new Error("Debes registrar al menos un item valido.");
  }

  const requestedQuantities = new Map<string, number>();

  for (let index = 0; index < productIds.length; index += 1) {
    const productId = productIds[index];
    const quantity = rawQuantities[index];

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Las cantidades deben ser enteros positivos.");
    }

    requestedQuantities.set(productId, (requestedQuantities.get(productId) ?? 0) + quantity);
  }

  return requestedQuantities;
}

export function parseCreditConfig(formData: FormData) {
  const initialPayment = requiredNumber(formData, "initialPayment", "El pago inicial es invalido.");
  const installmentCount = requiredInt(formData, "installmentCount", "La cantidad de cuotas es invalida.");
  const installmentFrequencyDays = requiredInt(formData, "installmentFrequencyDays", "La frecuencia de cuotas es invalida.");
  const firstInstallmentDateRaw = requiredText(formData, "firstInstallmentDate", "La fecha de primera cuota es obligatoria.");
  const firstInstallmentDate = new Date(`${firstInstallmentDateRaw}T00:00:00`);

  if (!Number.isFinite(initialPayment) || initialPayment < 0) {
    throw new Error("El pago inicial es invalido.");
  }

  if (!Number.isFinite(installmentCount) || installmentCount <= 0) {
    throw new Error("La cantidad de cuotas debe ser mayor a cero.");
  }

  if (!Number.isFinite(installmentFrequencyDays) || installmentFrequencyDays <= 0) {
    throw new Error("La frecuencia de cuotas debe ser mayor a cero.");
  }

  if (Number.isNaN(firstInstallmentDate.getTime())) {
    throw new Error("Fecha de primera cuota invalida.");
  }

  return {
    initialPayment,
    installmentCount,
    installmentFrequencyDays,
    firstInstallmentDate,
    initialPaymentMethod: normalizePaymentMethod(optionalText(formData, "creditInitialPaymentMethod")),
  };
}
