"use client";

import { PaymentMethod } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createPaymentAction } from "@/lib/actions/sales";
import { getPaymentMethodLabel } from "@/lib/labels";

type CollectPaymentModalButtonProps = {
  saleId: string;
  customerLabel: string;
  nextAmount: number;
  maxAmount: number;
};

export function CollectPaymentModalButton({ saleId, customerLabel, nextAmount, maxAmount }: CollectPaymentModalButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const suggestedAmount = Math.max(Math.min(nextAmount, maxAmount), 0.01);

  async function handleCollect(formData: FormData) {
    setSubmitError(null);

    try {
      await createPaymentAction(formData);
      setOpen(false);
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo registrar el cobro.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
      >
        Cobrar
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Registrar cobro</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            <p className="mb-3 text-sm text-slate-600">
              Cliente: <span className="font-medium text-slate-900">{customerLabel}</span>
            </p>

            <form action={handleCollect} className="space-y-3">
              <input type="hidden" name="saleId" value={saleId} />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Monto (BOB) *</label>
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  max={maxAmount.toFixed(2)}
                  step="0.01"
                  required
                  defaultValue={suggestedAmount.toFixed(2)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Metodo *</label>
                <select name="method" defaultValue={PaymentMethod.CASH} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                  <option value={PaymentMethod.CASH}>{getPaymentMethodLabel(PaymentMethod.CASH)}</option>
                  <option value={PaymentMethod.TRANSFER}>{getPaymentMethodLabel(PaymentMethod.TRANSFER)}</option>
                  <option value={PaymentMethod.QR}>{getPaymentMethodLabel(PaymentMethod.QR)}</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de cobro</label>
                <input
                  name="paidAt"
                  type="date"
                  defaultValue={getTodayInputDate()}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nota</label>
                <input name="note" placeholder="Detalle del cobro" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
              </div>

              {submitError ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p> : null}

              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Registrar cobro
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getTodayInputDate() {
  const today = new Date();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}
