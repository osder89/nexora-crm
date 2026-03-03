"use server";

import { revalidatePath } from "next/cache";

import { assertUniqueProductSku, assertValidCategory, parseInitialStock, parseProductInput } from "@/lib/actions/products/shared";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function createProductAction(formData: FormData) {
  const user = await requireTenantUser();

  const input = parseProductInput(formData);
  const stock = parseInitialStock(formData);

  await assertUniqueProductSku(user.tenantId, input.sku);
  await assertValidCategory(user.tenantId, input.categoryId);

  await prisma.product.create({
    data: {
      tenantId: user.tenantId,
      categoryId: input.categoryId,
      name: input.name,
      sku: input.sku,
      cost: input.cost,
      price: input.price,
      stock,
      stockMin: input.stockMin,
      isActive: input.isActive,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  revalidatePath("/app/products");
}
