import { Prisma } from "@prisma/client";

import { optionalText, requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";

export type CustomerInput = {
  firstName: string;
  lastName: string;
  name: string;
  nit: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
};

export function parseCustomerInput(formData: FormData): CustomerInput {
  const firstName = requiredText(formData, "firstName", "El nombre es obligatorio.");
  const lastName = requiredText(formData, "lastName", "El apellido es obligatorio.");

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    nit: optionalText(formData, "nit"),
    email: optionalText(formData, "email")?.toLowerCase() ?? null,
    phone: optionalText(formData, "phone"),
    address: optionalText(formData, "address"),
    notes: optionalText(formData, "notes"),
    isActive: String(formData.get("isActive") ?? "true") === "true",
  };
}

type DuplicateParams = {
  tenantId: string;
  email: string | null;
  phone: string | null;
  excludeCustomerId?: string;
};

export async function assertNoDuplicateCustomer({ tenantId, email, phone, excludeCustomerId }: DuplicateParams) {
  const notClause = excludeCustomerId ? { id: excludeCustomerId } : undefined;

  const checks: Prisma.CustomerWhereInput[] = [];
  if (email) {
    checks.push({
      tenantId,
      deletedAt: null,
      email,
      ...(notClause ? { NOT: notClause } : {}),
    });
  }

  if (phone) {
    checks.push({
      tenantId,
      deletedAt: null,
      phone,
      ...(notClause ? { NOT: notClause } : {}),
    });
  }

  for (const where of checks) {
    const duplicate = await prisma.customer.findFirst({ where, select: { id: true } });
    if (duplicate) {
      throw new Error("Ya existe un cliente activo con ese email o telefono en este tenant.");
    }
  }
}
