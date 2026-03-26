export type CustomerFieldName = "firstName" | "lastName" | "nit" | "email" | "phone" | "address" | "notes" | "isActive";

export type CustomerFieldErrors = Partial<Record<CustomerFieldName, string>>;

export type CustomerFormValues = {
  firstName: string;
  lastName: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  isActive: "true" | "false";
};

export type CustomerInput = {
  firstName: string;
  lastName: string;
  name: string;
  nit: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
};

export class CustomerValidationError extends Error {
  fieldErrors: CustomerFieldErrors;

  constructor(fieldErrors: CustomerFieldErrors, message?: string) {
    super(message ?? getFirstCustomerFieldError(fieldErrors) ?? "Revisa los datos del cliente.");
    this.name = "CustomerValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function getEmptyCustomerFormValues(): CustomerFormValues {
  return {
    firstName: "",
    lastName: "",
    nit: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    isActive: "true",
  };
}

export function getCustomerFormValues(formData: FormData): CustomerFormValues {
  return {
    firstName: getTrimmedFormValue(formData, "firstName"),
    lastName: getTrimmedFormValue(formData, "lastName"),
    nit: getTrimmedFormValue(formData, "nit"),
    email: getTrimmedFormValue(formData, "email"),
    phone: getTrimmedFormValue(formData, "phone"),
    address: getTrimmedFormValue(formData, "address"),
    notes: getTrimmedFormValue(formData, "notes"),
    isActive: String(formData.get("isActive") ?? "true") === "false" ? "false" : "true",
  };
}

export function parseCustomerInput(formData: FormData): CustomerInput {
  return parseCustomerValues(getCustomerFormValues(formData));
}

export function parseCustomerValues(values: CustomerFormValues): CustomerInput {
  const fieldErrors: CustomerFieldErrors = {};

  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();

  if (!firstName) {
    fieldErrors.firstName = "El nombre es obligatorio.";
  }

  if (!lastName) {
    fieldErrors.lastName = "El apellido es obligatorio.";
  }

  const nitResult = normalizeNit(values.nit);
  if (nitResult.error) {
    fieldErrors.nit = nitResult.error;
  }

  const emailResult = normalizeEmail(values.email);
  if (emailResult.error) {
    fieldErrors.email = emailResult.error;
  }

  const phoneResult = normalizeBolivianPhone(values.phone);
  if (phoneResult.error) {
    fieldErrors.phone = phoneResult.error;
  }

  if (hasCustomerFieldErrors(fieldErrors)) {
    throw new CustomerValidationError(fieldErrors);
  }

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    nit: nitResult.value,
    email: emailResult.value,
    phone: phoneResult.value,
    address: values.address || null,
    notes: values.notes || null,
    isActive: values.isActive === "true",
  };
}

export function hasCustomerFieldErrors(fieldErrors: CustomerFieldErrors) {
  return Object.values(fieldErrors).some((value) => Boolean(value));
}

export function getFirstCustomerFieldError(fieldErrors: CustomerFieldErrors) {
  return Object.values(fieldErrors).find((value) => Boolean(value)) ?? null;
}

function getTrimmedFormValue(formData: FormData, field: CustomerFieldName) {
  const raw = formData.get(field);
  return typeof raw === "string" ? raw.trim() : "";
}

function normalizeNit(value: string): { value: string | null; error?: string } {
  if (!value) {
    return { value: null };
  }

  const normalized = value.replace(/[\s-]+/g, "");

  if (!/^\d+$/.test(normalized)) {
    return { value: null, error: "El NIT debe contener solo numeros." };
  }

  if (normalized.length < 5 || normalized.length > 15) {
    return { value: null, error: "El NIT debe tener entre 5 y 15 digitos." };
  }

  return { value: normalized };
}

function normalizeEmail(value: string): { value: string | null; error?: string } {
  if (!value) {
    return { value: null };
  }

  const normalized = value.toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);

  if (!isValid) {
    return { value: null, error: "El email no tiene un formato valido." };
  }

  return { value: normalized };
}

function normalizeBolivianPhone(value: string): { value: string | null; error?: string } {
  if (!value) {
    return { value: null };
  }

  const compact = value.replace(/[\s()-]+/g, "");
  const prefixed = compact.startsWith("+") ? `+${compact.slice(1).replace(/\+/g, "")}` : compact.replace(/\+/g, "");
  const digits = prefixed.startsWith("+") ? prefixed.slice(1) : prefixed;

  if (!/^\d+$/.test(digits)) {
    return { value: null, error: "El telefono solo puede contener numeros." };
  }

  const nationalNumber = digits.startsWith("591") && digits.length === 11 ? digits.slice(3) : digits;

  if (!/^[2-7]\d{7}$/.test(nationalNumber)) {
    return { value: null, error: "El telefono debe ser un numero boliviano valido de 8 digitos." };
  }

  return { value: nationalNumber };
}
