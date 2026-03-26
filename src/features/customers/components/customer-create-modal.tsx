"use client";

import { useState, type FormEvent, type InputHTMLAttributes } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { createCustomerClient } from "@/services/client/customers.service";
import { getBackendErrorMessage, getBackendFieldErrors } from "@/services/backend/error";
import { useToast } from "@/shared/components/toast-provider";

type CustomerFormValues = {
  firstName: string;
  lastName: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  isActive: "true" | "false";
};

type CustomerFieldErrors = Partial<Record<keyof CustomerFormValues, string>>;

const INITIAL_FORM_VALUES: CustomerFormValues = {
  firstName: "",
  lastName: "",
  nit: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  isActive: "true",
};

export function CustomerCreateModalButton() {
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<CustomerFormValues>(INITIAL_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<CustomerFieldErrors>({});
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(createCustomerClient, {
    onSuccess: () => {
      toast.success("Cliente registrado correctamente.");
      setFieldErrors({});
      setFormValues(INITIAL_FORM_VALUES);
      setOpen(false);
      refreshPage();
    },
  });

  function handleClose() {
    setOpen(false);
    setFormValues(INITIAL_FORM_VALUES);
    setFieldErrors({});
    resetError();
  }

  function handleFieldChange(name: keyof CustomerFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });

    resetError();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFormData = new FormData(event.currentTarget);
    const nextValues = getCustomerFormValues(nextFormData);

    try {
      await submit(nextFormData);
    } catch (mutationError) {
      const nextFieldErrors = getBackendFieldErrors<CustomerFieldErrors>(mutationError);
      setFormValues(nextValues);
      setFieldErrors(nextFieldErrors);

      if (!hasFieldErrors(nextFieldErrors)) {
        toast.error(getBackendErrorMessage(mutationError, "No se pudo registrar el cliente."));
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500"
      >
        + Agregar cliente
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Registrar cliente</h3>
              <button type="button" onClick={handleClose} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            {!hasFieldErrors(fieldErrors) && error ? <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Nombres *"
                  name="firstName"
                  required
                  value={formValues.firstName}
                  error={fieldErrors.firstName}
                  onChange={handleFieldChange}
                />
                <Field
                  label="Apellidos *"
                  name="lastName"
                  required
                  value={formValues.lastName}
                  error={fieldErrors.lastName}
                  onChange={handleFieldChange}
                />
                <Field
                  label="NIT"
                  name="nit"
                  inputMode="numeric"
                  placeholder="Solo numeros"
                  value={formValues.nit}
                  error={fieldErrors.nit}
                  onChange={handleFieldChange}
                />
                <Field
                  label="Telefono"
                  name="phone"
                  inputMode="tel"
                  placeholder="Ej: 71234567 o +59171234567"
                  value={formValues.phone}
                  error={fieldErrors.phone}
                  onChange={handleFieldChange}
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formValues.email}
                  error={fieldErrors.email}
                  onChange={handleFieldChange}
                />
                <Field
                  label="Direccion"
                  name="address"
                  value={formValues.address}
                  error={fieldErrors.address}
                  onChange={handleFieldChange}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Activo</label>
                  <select
                    name="isActive"
                    value={formValues.isActive}
                    onChange={(event) => handleFieldChange("isActive", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="true">Si</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formValues.notes}
                    onChange={(event) => handleFieldChange("notes", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                  <FieldError message={fieldErrors.notes} />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {pending ? "Guardando..." : "Guardar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

type FieldProps = {
  label: string;
  name: keyof CustomerFormValues;
  type?: string;
  required?: boolean;
  value: string;
  error?: string;
  placeholder?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  onChange: (name: keyof CustomerFormValues, value: string) => void;
};

function Field({
  label,
  name,
  type = "text",
  required = false,
  value,
  error,
  placeholder,
  inputMode,
  autoComplete,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(name, event.target.value)}
        className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 ${
          error ? "border-red-400 bg-red-50/50 focus:ring-red-200" : "border-slate-300"
        }`}
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

function hasFieldErrors(fieldErrors: CustomerFieldErrors) {
  return Object.values(fieldErrors).some((value) => Boolean(value));
}

function getCustomerFormValues(formData: FormData): CustomerFormValues {
  return {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    nit: String(formData.get("nit") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    isActive: String(formData.get("isActive") ?? "true") === "false" ? "false" : "true",
  };
}

