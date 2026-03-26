import { ValidationError } from "@/server/base/errors/validation.error";

export function requiredText(formData: FormData, field: string, message?: string) {
  const raw = formData.get(field);
  const value = typeof raw === "string" ? raw.trim() : "";

  if (!value) {
    throw new ValidationError(message ?? `${field} es obligatorio.`);
  }

  return value;
}

export function optionalText(formData: FormData, field: string) {
  const raw = formData.get(field);
  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim();
  return value.length > 0 ? value : null;
}

export function optionalDate(formData: FormData, field: string) {
  const value = optionalText(formData, field);
  return value ? new Date(value) : null;
}

export function requiredNumber(formData: FormData, field: string, message?: string) {
  const value = requiredText(formData, field, message);
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new ValidationError(message ?? `${field} debe ser numerico.`);
  }

  return parsed;
}

export function requiredInt(formData: FormData, field: string, message?: string) {
  const value = requiredText(formData, field, message);
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    throw new ValidationError(message ?? `${field} debe ser entero.`);
  }

  return parsed;
}
