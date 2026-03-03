"use client";

import { useState } from "react";

import { updateCustomerAction } from "@/lib/actions/customers";

export type CustomerUpdateData = {
  id: string;
  firstName: string;
  lastName: string;
  nit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
};

export function CustomerUpdateModalButton({ customer }: { customer: CustomerUpdateData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200"
      >
        Actualizar
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Actualizar cliente</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            <form action={updateCustomerAction} onSubmit={() => setOpen(false)} className="space-y-3">
              <input type="hidden" name="customerId" value={customer.id} />

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nombres *" name="firstName" required defaultValue={customer.firstName} />
                <Field label="Apellidos *" name="lastName" required defaultValue={customer.lastName} />
                <Field label="NIT" name="nit" defaultValue={customer.nit ?? ""} />
                <Field label="Telefono" name="phone" defaultValue={customer.phone ?? ""} />
                <Field label="Email" name="email" type="email" defaultValue={customer.email ?? ""} />
                <Field label="Direccion" name="address" defaultValue={customer.address ?? ""} />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Activo</label>
                  <select
                    name="isActive"
                    defaultValue={customer.isActive ? "true" : "false"}
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
                    defaultValue={customer.notes ?? ""}
                    rows={3}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Guardar cambios
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
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
};

function Field({ label, name, type = "text", required = false, defaultValue = "" }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
      />
    </div>
  );
}
