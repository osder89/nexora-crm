"use client";

import { type FormEvent } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { updateTenantSettingsClient } from "@/services/client/settings.service";
import type { TenantSettings } from "@/services/server/settings.service";
import { useToast } from "@/shared/components/toast-provider";
import { Card, Input, Label } from "@/shared/components/ui";

export function TenantSettingsForm({ tenant }: { tenant: TenantSettings }) {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(updateTenantSettingsClient, {
    onSuccess: () => {
      toast.success("Configuracion guardada correctamente.");
      refreshPage();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await submit(new FormData(event.currentTarget));
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo guardar la configuracion.");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Nombre comercial *</Label>
            <Input name="name" defaultValue={tenant.name} required onChange={resetError} />
          </div>
          <div>
            <Label>Color primario</Label>
            <Input name="primaryColor" defaultValue={tenant.primaryColor ?? ""} placeholder="#0f172a" onChange={resetError} />
          </div>
          <div className="md:col-span-2">
            <Label>Logo URL</Label>
            <Input name="logoUrl" defaultValue={tenant.logoUrl ?? ""} onChange={resetError} />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "Guardando..." : "Guardar configuracion"}
        </button>
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </form>

      <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
        <p>Email fiscal: {tenant.email ?? "-"}</p>
        <p>Telefono: {tenant.phone ?? "-"}</p>
        <p>NIT: {tenant.nit ?? "-"}</p>
        <p>Direccion: {tenant.address ?? "-"}</p>
      </div>
    </Card>
  );
}

