"use client";

import { useState } from "react";

import { createSupplierAction } from "@/lib/actions/purchases";

export function SupplierCreateModalButton() {
  const [open, setOpen] = useState(false);

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
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            <form action={createSupplierAction} onSubmit={() => setOpen(false)} className="space-y-3">
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
                  <textarea name="notes" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
                </div>
              </div>

              <button type="submit" className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                Guardar proveedor
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
