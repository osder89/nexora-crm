import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
};

export class AuthorizationError extends Error {
  constructor(message = "No autorizado") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);

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

export async function requireSuperAdminUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user || user.role !== Role.SUPER_ADMIN) {
    throw new AuthorizationError();
  }

  return user;
}

export async function requireTenantUser(allowedRoles: Role[] = [Role.ADMIN_EMPRESA, Role.VENDEDOR]): Promise<SessionUser & { tenantId: string }> {
  const user = await getSessionUser();

  if (!user || !user.tenantId || !allowedRoles.includes(user.role)) {
    throw new AuthorizationError();
  }

  return {
    ...user,
    tenantId: user.tenantId,
  };
}

