"use server";

import { revalidatePath } from "next/cache";

import { parseCustomerInput, assertNoDuplicateCustomer } from "@/lib/actions/customers/shared";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function createCustomerAction(formData: FormData) {
  const user = await requireTenantUser();

  const input = parseCustomerInput(formData);

  await assertNoDuplicateCustomer({
    tenantId: user.tenantId,
    email: input.email,
    phone: input.phone,
  });

  await prisma.customer.create({
    data: {
      tenantId: user.tenantId,
      firstName: input.firstName,
      lastName: input.lastName,
      name: input.name,
      nit: input.nit,
      email: input.email,
      phone: input.phone,
      address: input.address,
      notes: input.notes,
      isActive: input.isActive,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  revalidatePath("/app/customers");
}
