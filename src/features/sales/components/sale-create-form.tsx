"use client";

import { PaymentMethod, SaleType } from "@prisma/client";
import { useMemo, useState, type FormEvent } from "react";

import { SaleItemsBuilder } from "@/features/sales/components/sale-items-builder";
import { buildSaleReceiptFilename, openPdfBytes } from "@/features/sales/lib/open-pdf";
import { createSaleReceiptPdf } from "@/features/sales/lib/sale-receipt-pdf";
import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { createSaleClient, getSaleDetailClient, type CreateSaleResponse } from "@/services/client/sales.service";
import { useToast } from "@/shared/components/toast-provider";
import { getCustomerFullName } from "@/shared/lib/customers";
import { getPaymentMethodLabel, getSaleTypeLabel } from "@/shared/lib/labels";
import { parseOptionalIntInput, parseOptionalNumberInput } from "@/shared/lib/numeric-input";

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
  companyName?: string;
  onSuccess?: () => void;
};

export function SaleCreateForm({
  customers,
  products,
  companyName = "Nexora CRM",
  onSuccess,
}: SaleCreateFormProps) {
  const [saleType, setSaleType] = useState<SaleType>(SaleType.CONTADO);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [initialPaymentInput, setInitialPaymentInput] = useState("0");
  const [installmentCountInput, setInstallmentCountInput] = useState("4");
  const [frequencyDaysInput, setFrequencyDaysInput] = useState("30");
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(getTodayInputDate());
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(createSaleClient, {
    onSuccess: async (result) => {
      toast.success("Venta registrada correctamente.");

      if (result.lowStockProducts.length > 0) {
        toast.info(buildLowStockMessage(result), "Stock bajo");
      }

      try {
        const sale = await getSaleDetailClient(result.sale.id);
        const pdfBytes = await createSaleReceiptPdf({
          sale,
          companyName,
        });

        openPdfBytes(pdfBytes, buildSaleReceiptFilename(result.sale.id));
        toast.info("El recibo PDF ya esta listo para imprimir.", "Recibo generado");
      } catch {
        toast.info("La venta se registro, pero no se pudo abrir el recibo PDF.", "Recibo pendiente");
      }

      onSuccess?.();
      refreshPage();
    },
  });

  const initialPayment = parseOptionalNumberInput(initialPaymentInput) ?? 0;
  const installmentCount = parseOptionalIntInput(installmentCountInput);
  const frequencyDays = parseOptionalIntInput(frequencyDaysInput);
  const creditBalance = Math.max(estimatedTotal - initialPayment, 0);
  const installmentPlan = useMemo(() => {
    if (!installmentCount || installmentCount <= 0 || !frequencyDays || frequencyDays <= 0) {
      return [];
    }

    if (saleType !== SaleType.CREDITO || !firstInstallmentDate || creditBalance <= 0) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await submit(new FormData(event.currentTarget));
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo registrar la venta.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
          <select name="customerId" onChange={resetError} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
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
            onChange={(event) => {
              resetError();
              setSaleType(event.target.value as SaleType);
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value={SaleType.CONTADO}>{getSaleTypeLabel(SaleType.CONTADO)}</option>
            <option value={SaleType.CREDITO}>{getSaleTypeLabel(SaleType.CREDITO)}</option>
          </select>
        </div>

        {saleType === SaleType.CONTADO ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Metodo de cobro</label>
            <select name="cashMethod" defaultValue={PaymentMethod.CASH} onChange={resetError} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
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
                value={initialPaymentInput}
                onChange={(event) => {
                  resetError();
                  setInitialPaymentInput(event.target.value);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Metodo pago inicial</label>
              <select
                name="creditInitialPaymentMethod"
                defaultValue={PaymentMethod.CASH}
                onChange={resetError}
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
                value={installmentCountInput}
                onChange={(event) => {
                  resetError();
                  setInstallmentCountInput(event.target.value);
                }}
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
                value={frequencyDaysInput}
                onChange={(event) => {
                  resetError();
                  setFrequencyDaysInput(event.target.value);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Primera cuota *</label>
              <input
                type="date"
                name="firstInstallmentDate"
                value={firstInstallmentDate}
                onChange={(event) => {
                  resetError();
                  setFirstInstallmentDate(event.target.value);
                }}
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
        <textarea name="notes" rows={3} onChange={resetError} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button type="submit" disabled={pending} className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">
        {pending ? "Registrando..." : "Registrar venta"}
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

function buildLowStockMessage(result: CreateSaleResponse) {
  if (result.lowStockProducts.length === 1) {
    const product = result.lowStockProducts[0];
    return `${product.name} quedo con stock bajo (${product.stock}/${product.stockMin}).`;
  }

  const visibleProducts = result.lowStockProducts.slice(0, 3).map((product) => `${product.name} (${product.stock}/${product.stockMin})`);
  const remainingCount = result.lowStockProducts.length - visibleProducts.length;
  const suffix = remainingCount > 0 ? ` y ${remainingCount} mas.` : ".";

  return `La venta dejo productos con stock bajo: ${visibleProducts.join(", ")}${suffix}`;
}
