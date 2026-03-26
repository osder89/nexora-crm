import type { IncomingMessage } from "http";

import type { GetServerSidePropsContext, Redirect } from "next";
import { getServerSession } from "next-auth";

import type { Role } from "@prisma/client";

import { authOptions } from "@/services/auth/auth-options";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
};

export async function getPageSessionUser(context: GetServerSidePropsContext): Promise<SessionUser | null> {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id || !session.user.email || !session.user.role) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    tenantId: session.user.tenantId ?? null,
  };
}

export function redirectToLogin(reason?: "expired"): Redirect {
  return {
    destination: reason ? `/login?reason=${reason}` : "/login",
    permanent: false,
  };
}

export function hasSessionCookie(request: IncomingMessage & { cookies?: Partial<Record<string, string>> }) {
  const cookies = request.cookies ?? {};
  return Boolean(cookies["next-auth.session-token"] || cookies["__Secure-next-auth.session-token"]);
}
