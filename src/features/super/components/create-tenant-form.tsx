"use client";

import { type FormEvent } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { createTenantClient } from "@/services/client/super.service";
import { useToast } from "@/shared/components/toast-provider";
import { FormGrid, Input, Label } from "@/shared/components/ui";

export function CreateTenantForm() {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(createTenantClient, {
    onSuccess: () => {
      toast.success("Tenant creado correctamente.");
      refreshPage();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await submit(new FormData(event.currentTarget));
      event.currentTarget.reset();
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo crear el tenant.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormGrid>
        <div>
          <Label>Nombre empresa *</Label>
          <Input name="name" required onChange={resetError} />
        </div>
        <div>
          <Label>NIT</Label>
          <Input name="nit" onChange={resetError} />
        </div>
        <div>
          <Label>Email</Label>
          <Input name="email" type="email" onChange={resetError} />
        </div>
        <div>
          <Label>Telefono</Label>
          <Input name="phone" onChange={resetError} />
        </div>
        <div>
          <Label>Direccion</Label>
          <Input name="address" onChange={resetError} />
        </div>
        <div>
          <Label>Logo URL</Label>
          <Input name="logoUrl" onChange={resetError} />
        </div>
        <div>
          <Label>Color primario</Label>
          <Input name="primaryColor" placeholder="#0f172a" onChange={resetError} />
        </div>
      </FormGrid>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Creando..." : "Crear tenant"}
      </button>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

