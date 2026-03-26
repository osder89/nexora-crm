"use client";

import { PaymentMethod } from "@prisma/client";
import { type FormEvent } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { createPaymentClient } from "@/services/client/sales.service";
import { useToast } from "@/shared/components/toast-provider";
import { getPaymentMethodLabel } from "@/shared/lib/labels";
import { Input, Label, Select } from "@/shared/components/ui";

type SalePaymentFormProps = {
  saleId: string;
};

export function SalePaymentForm({ saleId }: SalePaymentFormProps) {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(createPaymentClient, {
    onSuccess: () => {
      toast.success("Pago registrado correctamente.");
      refreshPage();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("saleId", saleId);

    try {
      await submit(formData);
      event.currentTarget.reset();
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo registrar el pago.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Monto (BOB) *</Label>
          <Input name="amount" type="number" min="0.01" step="0.01" required onChange={resetError} />
        </div>
        <div>
          <Label>Metodo *</Label>
          <Select name="method" defaultValue={PaymentMethod.CASH} onChange={resetError}>
            <option value={PaymentMethod.CASH}>{getPaymentMethodLabel(PaymentMethod.CASH)}</option>
            <option value={PaymentMethod.TRANSFER}>{getPaymentMethodLabel(PaymentMethod.TRANSFER)}</option>
            <option value={PaymentMethod.QR}>{getPaymentMethodLabel(PaymentMethod.QR)}</option>
          </Select>
        </div>
        <div>
          <Label>Fecha pago</Label>
          <Input name="paidAt" type="date" onChange={resetError} />
        </div>
        <div>
          <Label>Nota</Label>
          <Input name="note" onChange={resetError} />
        </div>
      </div>
      <button type="submit" disabled={pending} className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">
        {pending ? "Registrando..." : "Registrar pago"}
      </button>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

