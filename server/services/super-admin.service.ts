import { hash } from "bcrypt";
import { Role } from "@prisma/client";

import { ApplicationError } from "@/server/base/errors/application.error";
import { prisma } from "@/server/repositories/prisma";
import { createTenantRecord, getTenantById, listTenants, toggleTenantStatusRecord } from "@/server/repositories/tenant.repository";
import { createUserRecord, getUserByEmail } from "@/server/repositories/user.repository";
import type { SuperAdminActor } from "@/server/types/actor";

export async function createTenant(
  _actor: SuperAdminActor,
  input: {
    name: string;
    nit: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
  },
) {
  return createTenantRecord(prisma, input);
}

export async function toggleTenantStatus(_actor: SuperAdminActor, tenantId: string, nextState: boolean) {
  if (!tenantId) {
    throw new ApplicationError("Tenant invalido.", {
      code: "TENANT_INVALID",
      statusCode: 422,
    });
  }

  return toggleTenantStatusRecord(prisma, tenantId, nextState);
}

export async function createTenantAdmin(
  _actor: SuperAdminActor,
  input: { tenantId: string; email: string; password: string },
) {
  const tenant = await getTenantById(prisma, input.tenantId);
  if (!tenant) {
    throw new ApplicationError("Tenant no encontrado.", {
      code: "TENANT_NOT_FOUND",
      statusCode: 404,
    });
  }

  const existing = await getUserByEmail(prisma, input.email);
  if (existing) {
    throw new ApplicationError("El email ya esta en uso.", {
      code: "USER_EMAIL_DUPLICATED",
      statusCode: 409,
    });
  }

  return createUserRecord(prisma, {
    email: input.email,
    passwordHash: await hash(input.password, 10),
    role: Role.ADMIN_EMPRESA,
    tenantId: input.tenantId,
    isActive: true,
  });
}

export async function getTenantsData() {
  const tenants = await listTenants(prisma);

  return {
    tenants,
  };
}
