"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";

import { clearSessionActivityState, markSessionActivity } from "@/services/auth/session-activity.client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sessionMessage = useMemo(() => {
    const reason = typeof router.query.reason === "string" ? router.query.reason : null;

    if (reason === "idle") {
      return "La sesion se cerro por inactividad. Vuelve a ingresar para continuar.";
    }

    if (reason === "expired") {
      return "La sesion vencio o el acceso ya no es valido. Ingresa nuevamente.";
    }

    return null;
  }, [router.query.reason]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    if (!result || result.error) {
      clearSessionActivityState();
      setError("Credenciales invalidas o usuario inactivo.");
      setLoading(false);
      return;
    }

    markSessionActivity();
    await router.push(result.url ?? "/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">MiniCRM</h1>
        <p className="mt-1 text-sm text-slate-500">Accede con tu usuario de empresa o super admin.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              name="email"
              type="email"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              name="password"
              type="password"
              required
            />
          </div>

          {sessionMessage ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{sessionMessage}</p> : null}
          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">Moneda del sistema: BOB.</p>
      </section>
    </main>
  );
}
