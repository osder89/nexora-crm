"use client";

import { type FormEvent } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { cancelPurchaseClient } from "@/services/client/purchases.service";
import { useToast } from "@/shared/components/toast-provider";
import { Label, Textarea } from "@/shared/components/ui";

type CancelPurchaseFormProps = {
  purchaseId: string;
};

export function CancelPurchaseForm({ purchaseId }: CancelPurchaseFormProps) {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(cancelPurchaseClient, {
    onSuccess: () => {
      toast.success("Compra cancelada correctamente.");
      refreshPage();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("purchaseId", purchaseId);

    try {
      await submit(formData);
      event.currentTarget.reset();
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo cancelar la compra.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Motivo de cancelacion</Label>
        <Textarea name="cancelReason" rows={2} placeholder="Proveedor sin stock, error de pedido, etc." onChange={resetError} />
      </div>
      <button type="submit" disabled={pending} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300">
        {pending ? "Cancelando..." : "Cancelar compra"}
      </button>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

