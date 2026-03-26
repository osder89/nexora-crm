"use client";

import { useState, type FormEvent } from "react";

import { usePageRefresh } from "@/hooks/use-page-refresh";
import { useServiceMutation } from "@/hooks/use-service-mutation";
import { createProductCategoryClient } from "@/services/client/products.service";
import { useToast } from "@/shared/components/toast-provider";

export function ProductCategoryCreateModalButton() {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const refreshPage = usePageRefresh();
  const { pending, error, submit, resetError } = useServiceMutation(createProductCategoryClient, {
    onSuccess: () => {
      toast.success("Categoria registrada correctamente.");
      setOpen(false);
      refreshPage();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await submit(new FormData(event.currentTarget));
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo registrar la categoria.");
    }
  }

  function handleClose() {
    resetError();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
      >
        + Nueva categoria
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Registrar categoria</h3>
              <button type="button" onClick={handleClose} className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Cerrar
              </button>
            </div>

            {error ? <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Nombre *" name="name" required />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Descripcion</label>
                <textarea name="description" rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Activo</label>
                <select name="isActive" defaultValue="true" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                  <option value="true">Si</option>
                  <option value="false">No</option>
                </select>
              </div>
              <button type="submit" disabled={pending} className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">
                {pending ? "Guardando..." : "Guardar categoria"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, name, required = false }: { label: string; name: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type="text"
        required={required}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
      />
    </div>
  );
}

