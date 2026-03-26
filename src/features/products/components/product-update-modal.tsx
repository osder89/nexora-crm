"use client";

import { useState, type FormEvent } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { updateProductClient } from "@/services/client/products.service";
import { useToast } from "@/shared/components/toast-provider";
import type { ProductCategoryOption } from "@/features/products/components/product-create-modal";

export type ProductUpdateData = {
  id: string;
  name: string;
  sku: string | null;
  categoryId: string | null;
  cost: number | null;
  price: number;
  stock: number;
  stockMin: number;
  isActive: boolean;
};

export function ProductUpdateModalButton({ product, categories }: { product: ProductUpdateData; categories: ProductCategoryOption[] }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(updateProductClient, {
    onSuccess: () => {
      toast.success("Producto actualizado correctamente.");
      setOpen(false);
      refreshPage();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await submit(new FormData(event.currentTarget));
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo actualizar el producto.");
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
        className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200"
      >
        Actualizar
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Actualizar producto</h3>
              <button type="button" onClick={handleClose} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            {error ? <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="hidden" name="productId" value={product.id} />

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nombre *" name="name" required defaultValue={product.name} />
                <Field label="SKU" name="sku" defaultValue={product.sku ?? ""} />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
                  <select
                    name="categoryId"
                    defaultValue={product.categoryId ?? ""}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="">Sin categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="Costo" name="cost" type="number" step="0.01" min="0" defaultValue={product.cost?.toString() ?? ""} />
                <Field label="Precio *" name="price" type="number" step="0.01" min="0" required defaultValue={String(product.price)} />
                <Field label="Stock actual" name="stockReadonly" type="number" defaultValue={String(product.stock)} disabled />
                <Field label="Stock minimo *" name="stockMin" type="number" step="1" required defaultValue={String(product.stockMin)} />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Activo</label>
                  <select
                    name="isActive"
                    defaultValue={product.isActive ? "true" : "false"}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="true">Si</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={pending} className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">
                {pending ? "Guardando..." : "Guardar cambios"}
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
  disabled?: boolean;
};

function Field({ label, name, type = "text", required = false, defaultValue = "", step, min, disabled = false }: FieldProps) {
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
        disabled={disabled}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100"
      />
    </div>
  );
}

