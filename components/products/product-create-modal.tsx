"use client";

import { useState } from "react";

import { createProductAction } from "@/lib/actions/products";

export type ProductCategoryOption = {
  id: string;
  name: string;
};

export function ProductCreateModalButton({ categories }: { categories: ProductCategoryOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500"
      >
        + Agregar producto
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Registrar producto</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            <form action={createProductAction} onSubmit={() => setOpen(false)} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nombre *" name="name" required />
                <Field label="SKU" name="sku" />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
                  <select name="categoryId" defaultValue="" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                    <option value="">Sin categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="Costo" name="cost" type="number" step="0.01" min="0" />
                <Field label="Precio *" name="price" type="number" step="0.01" min="0" required />
                <Field label="Stock inicial *" name="stock" type="number" step="1" required defaultValue="0" />
                <Field label="Stock minimo *" name="stockMin" type="number" step="1" required defaultValue="0" />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Activo</label>
                  <select name="isActive" defaultValue="true" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                    <option value="true">Si</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                Guardar producto
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
  defaultValue?: string;
  step?: string;
  min?: string;
};

function Field({ label, name, type = "text", required = false, defaultValue = "", step, min }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        step={step}
        min={min}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
      />
    </div>
  );
}
