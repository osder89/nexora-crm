"use client";

import { type FormEvent } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { createVendorClient } from "@/services/client/users.service";
import { useToast } from "@/shared/components/toast-provider";
import { Input, Label } from "@/shared/components/ui";

export function CreateVendorForm() {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(createVendorClient, {
    onSuccess: () => {
      toast.success("Vendedor creado correctamente.");
      refreshPage();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await submit(new FormData(event.currentTarget));
      event.currentTarget.reset();
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo crear el vendedor.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
      <div>
        <Label>Email *</Label>
        <Input type="email" name="email" required onChange={resetError} />
      </div>
      <div>
        <Label>Password inicial *</Label>
        <Input type="text" name="password" required minLength={6} onChange={resetError} />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "Creando..." : "Crear vendedor"}
        </button>
      </div>
      {error ? <p className="md:col-span-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

