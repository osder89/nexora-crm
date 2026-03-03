"use server";

import { revalidatePath } from "next/cache";

import { optionalText, requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function createProductCategoryAction(formData: FormData) {
  const user = await requireTenantUser();

  const name = requiredText(formData, "name", "El nombre de categoria es obligatorio.");
  const description = optionalText(formData, "description");
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  const existing = await prisma.productCategory.findFirst({
    where: {
      tenantId: user.tenantId,
      deletedAt: null,
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Ya existe una categoria activa con ese nombre.");
  }

  await prisma.productCategory.create({
    data: {
      tenantId: user.tenantId,
      name,
      description,
      isActive,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  revalidatePath("/app/products");
}
