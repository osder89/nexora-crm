"use client";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { toggleTenantStatusClient } from "@/services/client/super.service";
import { useToast } from "@/shared/components/toast-provider";

type TenantStatusToggleButtonProps = {
  tenantId: string;
  isActive: boolean;
};

export function TenantStatusToggleButton({ tenantId, isActive }: TenantStatusToggleButtonProps) {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, submit } = useServiceMutation(toggleTenantStatusClient, {
    onSuccess: () => {
      toast.success("Tenant actualizado correctamente.");
      refreshPage();
    },
  });

  async function handleClick() {
    const formData = new FormData();
    formData.set("tenantId", tenantId);
    formData.set("nextState", isActive ? "false" : "true");

    try {
      await submit(formData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el tenant.");
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void handleClick()}
      className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {pending ? "Guardando..." : isActive ? "Desactivar" : "Activar"}
    </button>
  );
}

