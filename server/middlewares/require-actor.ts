import { Role } from "@prisma/client";
import type { Request } from "express";

import { AuthorizationError } from "@/server/classes/errors/authorization.error";
import { assertSuperAdminActor, assertTenantActor } from "@/server/types/actor";

export function requireRequestActor(req: Request) {
  if (!req.actor) {
    throw new AuthorizationError();
  }

  return req.actor;
}

export function requireRequestTenantActor(req: Request, allowedRoles: Role[] = [Role.ADMIN_EMPRESA, Role.VENDEDOR]) {
  return assertTenantActor(requireRequestActor(req), allowedRoles);
}

export function requireRequestSuperAdmin(req: Request) {
  return assertSuperAdminActor(requireRequestActor(req));
}
