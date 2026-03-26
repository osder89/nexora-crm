import { Role } from "@prisma/client";

import { AuthorizationError } from "@/server/classes/errors/authorization.error";

export type AppActor = {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
};

export type TenantActor = AppActor & {
  tenantId: string;
};

export type SuperAdminActor = AppActor & {
  role: "SUPER_ADMIN";
};

export function assertTenantActor(
  actor: AppActor | null | undefined,
  allowedRoles: Role[] = [Role.ADMIN_EMPRESA, Role.VENDEDOR],
): TenantActor {
  if (!actor || !actor.tenantId || !allowedRoles.includes(actor.role)) {
    throw new AuthorizationError();
  }

  return {
    ...actor,
    tenantId: actor.tenantId,
  };
}

export function assertSuperAdminActor(actor: AppActor | null | undefined): SuperAdminActor {
  if (!actor || actor.role !== Role.SUPER_ADMIN) {
    throw new AuthorizationError();
  }

  return actor as SuperAdminActor;
}
