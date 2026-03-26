"use client";

import { type FormEvent } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { createTenantAdminClient } from "@/services/client/super.service";
import type { SuperTenant } from "@/services/server/super.service";
import { useToast } from "@/shared/components/toast-provider";
import { Input, Label } from "@/shared/components/ui";

type CreateTenantAdminFormProps = {
  tenants: SuperTenant[];
};

export function CreateTenantAdminForm({ tenants }: CreateTenantAdminFormProps) {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(createTenantAdminClient, {
    onSuccess: () => {
      toast.success("Administrador creado correctamente.");
      refreshPage();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await submit(new FormData(event.currentTarget));
      event.currentTarget.reset();
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo crear el administrador.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4">
      <div>
        <Label>Tenant *</Label>
        <select
          name="tenantId"
          required
          defaultValue=""
          onChange={resetError}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring"
        >
          <option value="">Selecciona...</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Email *</Label>
        <Input name="email" type="email" required onChange={resetError} />
      </div>
      <div>
        <Label>Password inicial *</Label>
        <Input name="password" type="text" required minLength={6} onChange={resetError} />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "Creando..." : "Crear admin"}
        </button>
      </div>
      {error ? <p className="md:col-span-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

