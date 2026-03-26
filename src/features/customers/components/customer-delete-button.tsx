"use client";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { softDeleteCustomerClient } from "@/services/client/customers.service";
import { useToast } from "@/shared/components/toast-provider";

type CustomerDeleteButtonProps = {
  customerId: string;
};

export function CustomerDeleteButton({ customerId }: CustomerDeleteButtonProps) {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, submit } = useServiceMutation(softDeleteCustomerClient, {
    onSuccess: () => {
      toast.success("Cliente eliminado correctamente.");
      refreshPage();
    },
  });

  async function handleClick() {
    const formData = new FormData();
    formData.set("customerId", customerId);

    try {
      await submit(formData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el cliente.");
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void handleClick()}
      className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
    >
      {pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}

