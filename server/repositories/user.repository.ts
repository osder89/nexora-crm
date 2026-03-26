import { Role } from "@prisma/client";

import type { PrismaDbClient } from "@/server/repositories/prisma";

export async function getUserByEmail(db: PrismaDbClient, email: string) {
  return db.user.findUnique({ where: { email } });
}

export async function createUserRecord(
  db: PrismaDbClient,
  input: {
    email: string;
    passwordHash: string;
    role: Role;
    tenantId: string | null;
    isActive: boolean;
  },
) {
  return db.user.create({
    data: input,
  });
}

export async function findTenantVendorById(db: PrismaDbClient, tenantId: string, userId: string) {
  return db.user.findFirst({
    where: {
      id: userId,
      tenantId,
      role: Role.VENDEDOR,
    },
    select: { id: true },
  });
}

export async function toggleVendorStatusRecord(db: PrismaDbClient, tenantId: string, userId: string, nextState: boolean) {
  return db.user.updateMany({
    where: {
      id: userId,
      tenantId,
      role: Role.VENDEDOR,
    },
    data: { isActive: nextState },
  });
}

export async function listTenantUsers(db: PrismaDbClient, tenantId: string) {
  return db.user.findMany({
    where: {
      tenantId,
    },
    orderBy: { createdAt: "desc" },
  });
}
