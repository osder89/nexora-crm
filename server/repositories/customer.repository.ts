import type { Prisma } from "@prisma/client";

import type { CustomerInput } from "@/server/domain/customers/shared";
import type { PrismaDbClient } from "@/server/repositories/prisma";

export async function findActiveCustomerById(db: PrismaDbClient, tenantId: string, customerId: string) {
  return db.customer.findFirst({
    where: {
      id: customerId,
      tenantId,
      deletedAt: null,
    },
    select: { id: true },
  });
}

export async function findDuplicateActiveCustomers(
  db: PrismaDbClient,
  tenantId: string,
  params: {
    nit: string | null;
    email: string | null;
    phone: string | null;
    excludeCustomerId?: string;
  },
) {
  const whereBase = {
    tenantId,
    deletedAt: null,
    ...(params.excludeCustomerId ? { NOT: { id: params.excludeCustomerId } } : {}),
  };

  const [nitDuplicate, emailDuplicate, phoneDuplicate] = await Promise.all([
    params.nit
      ? db.customer.findFirst({
          where: {
            ...whereBase,
            nit: params.nit,
          },
          select: { id: true },
        })
      : null,
    params.email
      ? db.customer.findFirst({
          where: {
            ...whereBase,
            email: params.email,
          },
          select: { id: true },
        })
      : null,
    params.phone
      ? db.customer.findFirst({
          where: {
            ...whereBase,
            phone: params.phone,
          },
          select: { id: true },
        })
      : null,
  ]);

  return {
    nitDuplicate,
    emailDuplicate,
    phoneDuplicate,
  };
}

export async function createCustomerRecord(
  db: PrismaDbClient,
  actor: { id: string; tenantId: string },
  input: CustomerInput,
) {
  return db.customer.create({
    data: {
      tenantId: actor.tenantId,
      firstName: input.firstName,
      lastName: input.lastName,
      name: input.name,
      nit: input.nit,
      email: input.email,
      phone: input.phone,
      address: input.address,
      notes: input.notes,
      isActive: input.isActive,
      createdById: actor.id,
      updatedById: actor.id,
    },
  });
}

export async function updateCustomerRecord(
  db: PrismaDbClient,
  actor: { id: string; tenantId: string },
  customerId: string,
  input: CustomerInput,
) {
  return db.customer.updateMany({
    where: {
      id: customerId,
      tenantId: actor.tenantId,
      deletedAt: null,
    },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      name: input.name,
      nit: input.nit,
      email: input.email,
      phone: input.phone,
      address: input.address,
      notes: input.notes,
      isActive: input.isActive,
      updatedById: actor.id,
    },
  });
}

export async function softDeleteCustomerRecord(db: PrismaDbClient, actor: { id: string; tenantId: string }, customerId: string) {
  return db.customer.updateMany({
    where: {
      id: customerId,
      tenantId: actor.tenantId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      deletedById: actor.id,
      updatedById: actor.id,
      isActive: false,
    },
  });
}

export type CustomerListFilters = {
  q?: string;
  status?: "all" | "active" | "inactive";
  skip?: number;
  take?: number;
};

export async function countCustomers(db: PrismaDbClient, tenantId: string, filters: CustomerListFilters = {}) {
  return db.customer.count({
    where: buildCustomerWhereInput(tenantId, filters),
  });
}

export async function listCustomers(db: PrismaDbClient, tenantId: string, filters: CustomerListFilters = {}) {
  return db.customer.findMany({
    where: buildCustomerWhereInput(tenantId, filters),
    include: {
      sales: {
        where: { tenantId },
        select: { total: true, balance: true },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: filters.skip,
    take: filters.take,
  });
}

export async function getCustomerDetail(db: PrismaDbClient, tenantId: string, customerId: string) {
  return db.customer.findFirst({
    where: {
      id: customerId,
      tenantId,
      deletedAt: null,
    },
    include: {
      sales: {
        where: {
          tenantId,
          deletedAt: null,
        },
        include: {
          payments: {
            where: {
              tenantId,
              deletedAt: null,
            },
            orderBy: { paidAt: "desc" },
          },
          items: {
            where: { tenantId },
            include: { product: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      collectionLogs: {
        where: { tenantId },
        include: {
          createdBy: {
            select: { email: true },
          },
          sale: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

function buildCustomerWhereInput(tenantId: string, filters: CustomerListFilters): Prisma.CustomerWhereInput {
  const q = filters.q?.trim() ?? "";
  const status = filters.status ?? "all";

  return {
    tenantId,
    deletedAt: null,
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { nit: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}
