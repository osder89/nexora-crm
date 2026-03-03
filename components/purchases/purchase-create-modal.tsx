"use client";

import { useMemo, useState } from "react";

import { PurchaseItemsBuilder } from "@/components/purchases/purchase-items-builder";
import { createPurchaseAction } from "@/lib/actions/purchases";

type SupplierOption = {
  id: string;
  name: string;
};

type ProductOption = {
  id: string;
  name: string;
};

type PurchaseCreateModalButtonProps = {
  suppliers: SupplierOption[];
  products: ProductOption[];
};

export function PurchaseCreateModalButton({ suppliers, products }: PurchaseCreateModalButtonProps) {
  const [open, setOpen] = useState(false);
  const missingData = useMemo(() => suppliers.length === 0 || products.length === 0, [products.length, suppliers.length]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={missingData}
        className="inline-flex items-center rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
      >
        + Nuevo pedido
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Registrar pedido de compra</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            {missingData ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Necesitas al menos un proveedor activo y un producto activo para registrar pedidos.
              </div>
            ) : (
              <form action={createPurchaseAction} onSubmit={() => setOpen(false)} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Proveedor *</label>
                    <select name="supplierId" required defaultValue="" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                      <option value="">Selecciona...</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Fecha esperada</label>
                    <input name="expectedAt" type="date" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Items *</label>
                  <PurchaseItemsBuilder products={products} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
                  <textarea name="notes" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
                </div>

                <button type="submit" className="inline-flex items-center rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600">
                  Registrar pedido
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
