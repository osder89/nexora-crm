import { hash } from "bcrypt";
import { Role } from "@prisma/client";

import { ApplicationError } from "@/server/base/errors/application.error";
import { prisma } from "@/server/repositories/prisma";
import {
  createUserRecord,
  findTenantVendorById,
  getUserByEmail,
  listTenantUsers,
  toggleVendorStatusRecord,
} from "@/server/repositories/user.repository";
import type { TenantActor } from "@/server/types/actor";

export async function createVendor(actor: TenantActor, input: { email: string; password: string }) {
  if (actor.role !== Role.ADMIN_EMPRESA) {
    throw new ApplicationError("No autorizado.", {
      code: "AUTHORIZATION_ERROR",
      statusCode: 403,
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
    tenantId: actor.tenantId,
    email: input.email,
    passwordHash: await hash(input.password, 10),
    role: Role.VENDEDOR,
    isActive: true,
  });
}

export async function toggleTenantUserStatus(actor: TenantActor, userId: string, nextState: boolean) {
  if (actor.role !== Role.ADMIN_EMPRESA) {
    throw new ApplicationError("No autorizado.", {
      code: "AUTHORIZATION_ERROR",
      statusCode: 403,
    });
  }

  const target = await findTenantVendorById(prisma, actor.tenantId, userId);
  if (!target) {
    throw new ApplicationError("Usuario no encontrado.", {
      code: "USER_NOT_FOUND",
      statusCode: 404,
    });
  }

  const updated = await toggleVendorStatusRecord(prisma, actor.tenantId, userId, nextState);
  if (updated.count === 0) {
    throw new ApplicationError("No se pudo actualizar el usuario.", {
      code: "USER_STATUS_UPDATE_FAILED",
      statusCode: 422,
    });
  }
}

export async function getTenantUsersData(tenantId: string) {
  const users = await listTenantUsers(prisma, tenantId);

  return {
    users,
  };
}
