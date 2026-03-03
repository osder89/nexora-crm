"use server";

import { revalidatePath } from "next/cache";

import { assertNoDuplicateCustomer, parseCustomerInput } from "@/lib/actions/customers/shared";
import { requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function updateCustomerAction(formData: FormData) {
  const user = await requireTenantUser();

  const customerId = requiredText(formData, "customerId", "Cliente invalido.");
  const input = parseCustomerInput(formData);

  await prisma.customer.findFirstOrThrow({
    where: {
      id: customerId,
      tenantId: user.tenantId,
      deletedAt: null,
    },
    select: { id: true },
  });

  await assertNoDuplicateCustomer({
    tenantId: user.tenantId,
    email: input.email,
    phone: input.phone,
    excludeCustomerId: customerId,
  });

  await prisma.customer.updateMany({
    where: {
      id: customerId,
      tenantId: user.tenantId,
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
      updatedById: user.id,
    },
  });

  revalidatePath("/app/customers");
  revalidatePath(`/app/customers/${customerId}`);
}
