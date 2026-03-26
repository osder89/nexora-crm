"use client";

import { useState, type FormEvent } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { createSupplierClient } from "@/services/client/purchases.service";
import { useToast } from "@/shared/components/toast-provider";

export function SupplierCreateModalButton() {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(createSupplierClient, {
    onSuccess: () => {
      toast.success("Proveedor registrado correctamente.");
      setOpen(false);
      refreshPage();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await submit(new FormData(event.currentTarget));
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo registrar el proveedor.");
    }
  }

  function handleClose() {
    resetError();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500"
      >
        + Agregar proveedor
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Registrar proveedor</h3>
              <button type="button" onClick={handleClose} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            {error ? <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nombre *" name="name" required />
                <Field label="NIT" name="nit" />
                <Field label="Telefono" name="phone" />
                <Field label="Email" name="email" type="email" />
                <div className="md:col-span-2">
                  <Field label="Direccion" name="address" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
                  <textarea name="notes" rows={2} onChange={resetError} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
                </div>
              </div>

              <button type="submit" disabled={pending} className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">
                {pending ? "Guardando..." : "Guardar proveedor"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
};

function Field({ label, name, type = "text", required = false }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input name={name} type={type} required={required} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
    </div>
  );
}

