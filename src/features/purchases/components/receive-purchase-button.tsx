"use client";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { receivePurchaseClient } from "@/services/client/purchases.service";
import { useToast } from "@/shared/components/toast-provider";

type ReceivePurchaseButtonProps = {
  purchaseId: string;
  label?: string;
};

export function ReceivePurchaseButton({ purchaseId, label = "Recibir" }: ReceivePurchaseButtonProps) {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, submit } = useServiceMutation(receivePurchaseClient, {
    onSuccess: () => {
      toast.success("Compra recibida correctamente.");
      refreshPage();
    },
  });

  async function handleClick() {
    const formData = new FormData();
    formData.set("purchaseId", purchaseId);

    try {
      await submit(formData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo recibir la compra.");
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void handleClick()}
      className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
    >
      {pending ? "Recibiendo..." : label}
    </button>
  );
}

