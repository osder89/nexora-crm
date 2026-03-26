"use client";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { toggleTenantUserStatusClient } from "@/services/client/users.service";
import { useToast } from "@/shared/components/toast-provider";

type UserStatusToggleButtonProps = {
  userId: string;
  isActive: boolean;
};

export function UserStatusToggleButton({ userId, isActive }: UserStatusToggleButtonProps) {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, submit } = useServiceMutation(toggleTenantUserStatusClient, {
    onSuccess: () => {
      toast.success("Usuario actualizado correctamente.");
      refreshPage();
    },
  });

  async function handleClick() {
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("nextState", isActive ? "false" : "true");

    try {
      await submit(formData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el usuario.");
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

