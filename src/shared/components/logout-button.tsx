"use client";

import { signOut } from "next-auth/react";

import { clearSessionActivityState } from "@/services/auth/session-activity.client";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        clearSessionActivityState();
        void signOut({ callbackUrl: "/login" });
      }}
      className={className ?? "rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"}
    >
      Salir
    </button>
  );
}
