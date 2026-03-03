"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function softDeleteCustomerAction(formData: FormData) {
  const user = await requireTenantUser([Role.ADMIN_EMPRESA]);

  const customerId = requiredText(formData, "customerId", "Cliente invalido.");

  const updated = await prisma.customer.updateMany({
    where: {
      id: customerId,
      tenantId: user.tenantId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      deletedById: user.id,
      updatedById: user.id,
      isActive: false,
    },
  });

  if (updated.count === 0) {
    throw new Error("Cliente no encontrado o ya eliminado.");
  }

  revalidatePath("/app/customers");
  revalidatePath(`/app/customers/${customerId}`);
}
