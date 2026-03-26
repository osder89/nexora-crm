import { Role } from "@prisma/client";

import type { PrismaDbClient } from "@/server/repositories/prisma";

export async function createTenantRecord(
  db: PrismaDbClient,
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
  return db.tenant.create({
    data: {
      name: input.name,
      nit: input.nit,
      phone: input.phone,
      email: input.email,
      address: input.address,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor,
      isActive: true,
    },
  });
}

export async function toggleTenantStatusRecord(db: PrismaDbClient, tenantId: string, nextState: boolean) {
  return db.tenant.update({
    where: { id: tenantId },
    data: { isActive: nextState },
  });
}

export async function getTenantById(db: PrismaDbClient, tenantId: string) {
  return db.tenant.findUnique({ where: { id: tenantId } });
}

export async function listTenants(db: PrismaDbClient) {
  return db.tenant.findMany({
    include: {
      _count: {
        select: {
          users: true,
          customers: true,
          products: true,
          sales: true,
        },
      },
      users: {
        where: { role: Role.ADMIN_EMPRESA },
        select: { id: true, email: true, isActive: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateTenantSettingsRecord(
  db: PrismaDbClient,
  tenantId: string,
  input: { name: string; logoUrl: string | null; primaryColor: string | null },
) {
  return db.tenant.update({
    where: { id: tenantId },
    data: {
      name: input.name,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor,
    },
  });
}
