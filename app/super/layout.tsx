import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { getSessionUser } from "@/lib/session";

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm text-slate-500">Panel Global</p>
            <h1 className="text-lg font-semibold">MiniCRM Super Admin</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="font-medium text-slate-700 hover:text-slate-900" href="/super/tenants">
              Tenants
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

