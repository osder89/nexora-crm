"use client";

import { useState } from "react";

import { SaleCreateForm, SaleProductOption } from "@/features/sales/components/sale-create-form";

type CustomerOption = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
};

type SaleCreateModalButtonProps = {
  customers: CustomerOption[];
  products: SaleProductOption[];
  companyName?: string;
};

export function SaleCreateModalButton({ customers, products, companyName }: SaleCreateModalButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500"
      >
        + Nueva venta
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Registrar venta</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            <SaleCreateForm customers={customers} products={products} companyName={companyName} onSuccess={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
