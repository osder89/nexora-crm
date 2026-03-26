import Link from "next/link";

import { LogoutButton } from "@/shared/components/logout-button";

type SuperLayoutProps = {
  children: React.ReactNode;
  email: string;
};

export function SuperLayout({ children, email }: SuperLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm text-slate-500">Panel Global</p>
            <h1 className="text-lg font-semibold">MiniCRM Super Admin</h1>
            <p className="text-xs text-slate-400">{email}</p>
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

export default SuperLayout;

