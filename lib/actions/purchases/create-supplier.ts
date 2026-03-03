"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { optionalText, requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function createSupplierAction(formData: FormData) {
  const user = await requireTenantUser([Role.ADMIN_EMPRESA]);

  const name = requiredText(formData, "name", "Nombre del proveedor obligatorio.");
  const nit = optionalText(formData, "nit");
  const phone = optionalText(formData, "phone");
  const email = optionalText(formData, "email");
  const address = optionalText(formData, "address");
  const notes = optionalText(formData, "notes");

  await prisma.supplier.create({
    data: {
      tenantId: user.tenantId,
      name,
      nit,
      phone,
      email,
      address,
      notes,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  revalidatePath("/app/purchases/suppliers");
  revalidatePath("/app/purchases/orders");
}
