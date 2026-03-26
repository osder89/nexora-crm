"use client";

import { type FormEvent } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { createCollectionLogClient } from "@/services/client/receivables.service";
import { useToast } from "@/shared/components/toast-provider";
import { Input, Label, Textarea } from "@/shared/components/ui";

type CollectionLogFormProps = {
  saleId: string;
};

export function CollectionLogForm({ saleId }: CollectionLogFormProps) {
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(createCollectionLogClient, {
    onSuccess: () => {
      toast.success("Seguimiento guardado correctamente.");
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
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo guardar el seguimiento.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Comentario *</Label>
        <Textarea name="comment" required rows={3} onChange={resetError} />
      </div>
      <div>
        <Label>Proximo contacto</Label>
        <Input name="nextContactAt" type="date" onChange={resetError} />
      </div>
      <button type="submit" disabled={pending} className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">
        {pending ? "Guardando..." : "Guardar seguimiento"}
      </button>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

