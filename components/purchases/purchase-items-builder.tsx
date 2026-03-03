"use client";

import { useMemo, useState } from "react";

type ProductOption = {
  id: string;
  name: string;
};

type ItemRow = {
  key: string;
  productId: string;
  quantity: number;
  unitCost: number;
};

type PurchaseItemsBuilderProps = {
  products: ProductOption[];
};

export function PurchaseItemsBuilder({ products }: PurchaseItemsBuilderProps) {
  const [rows, setRows] = useState<ItemRow[]>([{ key: crypto.randomUUID(), productId: "", quantity: 1, unitCost: 1 }]);

  const totalPreview = useMemo(() => rows.reduce((sum, row) => sum + row.quantity * row.unitCost, 0), [rows]);

  function addRow() {
    setRows((current) => [...current, { key: crypto.randomUUID(), productId: "", quantity: 1, unitCost: 1 }]);
  }

  function removeRow(key: string) {
    setRows((current) => {
      if (current.length === 1) {
        return current;
      }
      return current.filter((row) => row.key !== key);
    });
  }

  function updateRow(key: string, patch: Partial<ItemRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.key} className="grid gap-2 rounded-md border border-slate-200 p-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Producto *</label>
            <select
              name="productId"
              required
              value={row.productId}
              onChange={(event) => updateRow(row.key, { productId: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecciona...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Cantidad *</label>
            <input
              name="quantity"
              type="number"
              min={1}
              step={1}
              required
              value={row.quantity}
              onChange={(event) => updateRow(row.key, { quantity: Number(event.target.value) || 1 })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Costo unitario *</label>
            <input
              name="unitCost"
              type="number"
              min={0.01}
              step={0.01}
              required
              value={row.unitCost}
              onChange={(event) => updateRow(row.key, { unitCost: Number(event.target.value) || 0.01 })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end md:col-span-1">
            <button
              type="button"
              onClick={() => removeRow(row.key)}
              className="w-full rounded-md bg-red-600 px-2 py-2 text-xs font-medium text-white hover:bg-red-500"
            >
              {index === 0 ? "-" : "X"}
            </button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <button type="button" onClick={addRow} className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900">
          + Item
        </button>
        <p className="text-sm text-slate-600">Total estimado: BOB {totalPreview.toFixed(2)}</p>
      </div>
    </div>
  );
}
