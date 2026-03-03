"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requiredText } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function softDeleteProductAction(formData: FormData) {
  const user = await requireTenantUser([Role.ADMIN_EMPRESA]);

  const productId = requiredText(formData, "productId", "Producto invalido.");

  const updated = await prisma.product.updateMany({
    where: {
      id: productId,
      tenantId: user.tenantId,
      deletedAt: null,
    },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deletedById: user.id,
      updatedById: user.id,
    },
  });

  if (updated.count === 0) {
    throw new Error("Producto no encontrado o ya eliminado.");
  }

  revalidatePath("/app/products");
}
