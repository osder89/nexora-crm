"use client";

import { PaymentMethod, SaleType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { SaleItemsBuilder } from "@/components/sale-items-builder";
import { createSaleAction } from "@/lib/actions/sales";
import { getCustomerFullName } from "@/lib/customers";
import { getPaymentMethodLabel, getSaleTypeLabel } from "@/lib/labels";

type CustomerOption = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
};

export type SaleProductOption = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

type SaleCreateFormProps = {
  customers: CustomerOption[];
  products: SaleProductOption[];
  onSuccess?: () => void;
};

export function SaleCreateForm({ customers, products, onSuccess }: SaleCreateFormProps) {
  const router = useRouter();
  const [saleType, setSaleType] = useState<SaleType>(SaleType.CONTADO);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [initialPayment, setInitialPayment] = useState(0);
  const [installmentCount, setInstallmentCount] = useState(4);
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(getTodayInputDate());
  const [submitError, setSubmitError] = useState<string | null>(null);

  const creditBalance = Math.max(estimatedTotal - initialPayment, 0);
  const installmentPlan = useMemo(() => {
    if (saleType !== SaleType.CREDITO || installmentCount <= 0 || !firstInstallmentDate || creditBalance <= 0) {
      return [];
    }

    const totalCents = Math.round(creditBalance * 100);
    const base = Math.floor(totalCents / installmentCount);
    const remainder = totalCents - base * installmentCount;
    const firstDate = new Date(`${firstInstallmentDate}T00:00:00`);

    return Array.from({ length: installmentCount }, (_, index) => {
      const amountCents = base + (index < remainder ? 1 : 0);
      const dueDate = new Date(firstDate);
      dueDate.setDate(firstDate.getDate() + index * frequencyDays);

      return {
        installmentNumber: index + 1,
        dueDate,
        amount: amountCents / 100,
      };
    });
  }, [creditBalance, firstInstallmentDate, frequencyDays, installmentCount, saleType]);

  async function handleCreateSale(formData: FormData) {
    setSubmitError(null);

    try {
      await createSaleAction(formData);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo registrar la venta.");
    }
  }

  return (
    <form action={handleCreateSale} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
          <select name="customerId" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
            <option value="">Consumidor final</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {getCustomerFullName(customer)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de venta *</label>
          <select
            name="saleType"
            value={saleType}
            onChange={(event) => setSaleType(event.target.value as SaleType)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value={SaleType.CONTADO}>{getSaleTypeLabel(SaleType.CONTADO)}</option>
            <option value={SaleType.CREDITO}>{getSaleTypeLabel(SaleType.CREDITO)}</option>
          </select>
        </div>

        {saleType === SaleType.CONTADO ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Metodo de cobro</label>
            <select name="cashMethod" defaultValue={PaymentMethod.CASH} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
              <option value={PaymentMethod.CASH}>{getPaymentMethodLabel(PaymentMethod.CASH)}</option>
              <option value={PaymentMethod.TRANSFER}>{getPaymentMethodLabel(PaymentMethod.TRANSFER)}</option>
              <option value={PaymentMethod.QR}>{getPaymentMethodLabel(PaymentMethod.QR)}</option>
            </select>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Pago inicial (BOB)</label>
              <input
                type="number"
                name="initialPayment"
                min="0"
                step="0.01"
                value={initialPayment}
                onChange={(event) => setInitialPayment(Number(event.target.value) || 0)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Metodo pago inicial</label>
              <select
                name="creditInitialPaymentMethod"
                defaultValue={PaymentMethod.CASH}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                <option value={PaymentMethod.CASH}>{getPaymentMethodLabel(PaymentMethod.CASH)}</option>
                <option value={PaymentMethod.TRANSFER}>{getPaymentMethodLabel(PaymentMethod.TRANSFER)}</option>
                <option value={PaymentMethod.QR}>{getPaymentMethodLabel(PaymentMethod.QR)}</option>
              </select>
            </div>
          </>
        )}
      </div>

      {saleType === SaleType.CREDITO ? (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4">
          <h3 className="text-sm font-semibold text-cyan-900">Plan de pagos</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Numero de cuotas *</label>
              <input
                type="number"
                name="installmentCount"
                min={1}
                step={1}
                value={installmentCount}
                onChange={(event) => setInstallmentCount(Number(event.target.value) || 1)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cada cuantos dias *</label>
              <input
                type="number"
                name="installmentFrequencyDays"
                min={1}
                step={1}
                value={frequencyDays}
                onChange={(event) => setFrequencyDays(Number(event.target.value) || 1)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Primera cuota *</label>
              <input
                type="date"
                name="firstInstallmentDate"
                value={firstInstallmentDate}
                onChange={(event) => setFirstInstallmentDate(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="mt-3 text-sm text-slate-700">
            <p>Total estimado: <strong>BOB {estimatedTotal.toFixed(2)}</strong></p>
            <p>Saldo a financiar: <strong>BOB {creditBalance.toFixed(2)}</strong></p>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="border-b border-cyan-200 text-left text-cyan-900">
                  <th className="py-2 pr-3">Cuota</th>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Monto</th>
                </tr>
              </thead>
              <tbody>
                {installmentPlan.map((item) => (
                  <tr key={item.installmentNumber} className="border-b border-cyan-100">
                    <td className="py-2 pr-3">{item.installmentNumber}</td>
                    <td className="py-2 pr-3">{item.dueDate.toLocaleDateString("es-BO")}</td>
                    <td className="py-2 pr-3">BOB {item.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {installmentPlan.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2 text-slate-500">
                      El plan se mostrara cuando haya saldo, fecha y cuotas validas.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Items *</label>
        <SaleItemsBuilder products={products} onTotalChange={setEstimatedTotal} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
        <textarea name="notes" rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>

      {submitError ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p> : null}

      <button type="submit" className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Registrar venta
      </button>
    </form>
  );
}

function getTodayInputDate() {
  const today = new Date();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}
