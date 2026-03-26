import { Role } from "@prisma/client";

import { ApplicationError } from "@/server/base/errors/application.error";
import {
  CustomerValidationError,
  type CustomerFieldErrors,
  type CustomerInput,
} from "@/server/domain/customers/shared";
import { prisma } from "@/server/repositories/prisma";
import {
  countCustomers,
  createCustomerRecord,
  findActiveCustomerById,
  findDuplicateActiveCustomers,
  getCustomerDetail,
  listCustomers,
  softDeleteCustomerRecord,
  updateCustomerRecord,
  type CustomerListFilters,
} from "@/server/repositories/customer.repository";
import type { TenantActor } from "@/server/types/actor";

export async function createCustomer(actor: TenantActor, input: CustomerInput) {
  await assertUniqueCustomerFields(actor.tenantId, {
    nit: input.nit,
    email: input.email,
    phone: input.phone,
  });

  return createCustomerRecord(prisma, actor, input);
}

export async function updateCustomer(actor: TenantActor, customerId: string, input: CustomerInput) {
  const customer = await findActiveCustomerById(prisma, actor.tenantId, customerId);
  if (!customer) {
    throw new ApplicationError("Cliente no encontrado.", {
      code: "CUSTOMER_NOT_FOUND",
      statusCode: 404,
    });
  }

  await assertUniqueCustomerFields(actor.tenantId, {
    nit: input.nit,
    email: input.email,
    phone: input.phone,
    excludeCustomerId: customerId,
  });

  await updateCustomerRecord(prisma, actor, customerId, input);
}

export async function softDeleteCustomer(actor: TenantActor, customerId: string) {
  if (actor.role !== Role.ADMIN_EMPRESA) {
    throw new ApplicationError("No autorizado.", {
      code: "AUTHORIZATION_ERROR",
      statusCode: 403,
    });
  }

  const updated = await softDeleteCustomerRecord(prisma, actor, customerId);

  if (updated.count === 0) {
    throw new ApplicationError("Cliente no encontrado o ya eliminado.", {
      code: "CUSTOMER_NOT_FOUND",
      statusCode: 404,
    });
  }
}

export async function getCustomersPageData(tenantId: string, filters: CustomerListFilters = {}) {
  const [totalCustomers, customers] = await Promise.all([
    countCustomers(prisma, tenantId, filters),
    listCustomers(prisma, tenantId, filters),
  ]);

  return {
    totalCustomers,
    customers,
  };
}

export async function getCustomerDetailData(tenantId: string, customerId: string) {
  const customer = await getCustomerDetail(prisma, tenantId, customerId);

  if (!customer) {
    throw new ApplicationError("Cliente no encontrado.", {
      code: "CUSTOMER_NOT_FOUND",
      statusCode: 404,
    });
  }

  return customer;
}

async function assertUniqueCustomerFields(
  tenantId: string,
  params: {
    nit: string | null;
    email: string | null;
    phone: string | null;
    excludeCustomerId?: string;
  },
) {
  const duplicates = await findDuplicateActiveCustomers(prisma, tenantId, params);
  const fieldErrors: CustomerFieldErrors = {};

  if (duplicates.nitDuplicate) {
    fieldErrors.nit = "Ya existe un cliente activo con ese NIT.";
  }

  if (duplicates.emailDuplicate) {
    fieldErrors.email = "Ya existe un cliente activo con ese email.";
  }

  if (duplicates.phoneDuplicate) {
    fieldErrors.phone = "Ya existe un cliente activo con ese telefono.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new CustomerValidationError(fieldErrors);
  }
}
