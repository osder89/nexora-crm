"use client";

import { useState } from "react";

import { createProductCategoryAction } from "@/lib/actions/products";

export function ProductCategoryCreateModalButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
      >
        + Nueva categoria
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Registrar categoria</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            <form action={createProductCategoryAction} onSubmit={() => setOpen(false)} className="space-y-3">
              <Field label="Nombre *" name="name" required />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Descripcion</label>
                <textarea name="description" rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Activo</label>
                <select name="isActive" defaultValue="true" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                  <option value="true">Si</option>
                  <option value="false">No</option>
                </select>
              </div>
              <button type="submit" className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                Guardar categoria
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, name, required = false }: { label: string; name: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type="text"
        required={required}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
      />
    </div>
  );
}
