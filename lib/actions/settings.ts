"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { optionalText, requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function updateTenantSettingsAction(formData: FormData) {
  const user = await requireTenantUser([Role.ADMIN_EMPRESA]);

  const name = requiredText(formData, "name", "El nombre comercial es obligatorio.");

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      name,
      logoUrl: optionalText(formData, "logoUrl"),
      primaryColor: optionalText(formData, "primaryColor"),
    },
  });

  revalidatePath("/app/settings");
  revalidatePath("/app/dashboard");
}

