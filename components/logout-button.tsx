"use client";

import { signOut } from "next-auth/react";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={className ?? "rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"}
    >
      Salir
    </button>
  );
}
