"use client";

import { createContext, useContext, useEffect, useEffectEvent, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string | null;
  message: string;
  tone: ToastTone;
  duration: number;
};

type ToastOptions = {
  title?: string;
  message: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const DEFAULT_DURATION = 4000;
const MAX_TOASTS = 4;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function dismissToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function pushToast({ title, message, tone = "info", duration = DEFAULT_DURATION }: ToastOptions) {
    const id = Date.now() + Math.floor(Math.random() * 1000);

    setToasts((current) =>
      [...current, { id, title: title ?? null, message, tone, duration }].slice(-MAX_TOASTS),
    );
  }

  const contextValue: ToastContextValue = {
    toast: pushToast,
    success: (message, title = "Listo") => pushToast({ message, title, tone: "success" }),
    error: (message, title = "No se pudo completar") => pushToast({ message, title, tone: "error" }),
    info: (message, title = "Aviso") => pushToast({ message, title, tone: "info" }),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider.");
  }

  return context;
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const handleDismiss = useEffectEvent(() => {
    onDismiss(toast.id);
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      handleDismiss();
    }, toast.duration);

    return () => window.clearTimeout(timeoutId);
  }, [toast.duration]);

  const toneClasses =
    toast.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : toast.tone === "error"
        ? "border-red-200 bg-red-50 text-red-950"
        : "border-cyan-200 bg-cyan-50 text-cyan-950";

  const iconClasses =
    toast.tone === "success" ? "bg-emerald-600" : toast.tone === "error" ? "bg-red-600" : "bg-cyan-600";

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${toneClasses}`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${iconClasses}`} />

        <div className="min-w-0 flex-1">
          {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
          <p className="text-sm leading-5">{toast.message}</p>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-500 transition hover:bg-white/70 hover:text-slate-700"
          aria-label="Cerrar notificacion"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

