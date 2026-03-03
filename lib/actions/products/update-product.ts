"use server";

import { revalidatePath } from "next/cache";

import { requiredText } from "@/lib/actions/helpers";
import { assertUniqueProductSku, assertValidCategory, parseProductInput } from "@/lib/actions/products/shared";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

export async function updateProductAction(formData: FormData) {
  const user = await requireTenantUser();

  const productId = requiredText(formData, "productId", "Producto invalido.");
  const input = parseProductInput(formData);

  await prisma.product.findFirstOrThrow({
    where: {
      id: productId,
      tenantId: user.tenantId,
      deletedAt: null,
    },
    select: { id: true },
  });

  await assertUniqueProductSku(user.tenantId, input.sku, productId);
  await assertValidCategory(user.tenantId, input.categoryId);

  await prisma.product.updateMany({
    where: {
      id: productId,
      tenantId: user.tenantId,
      deletedAt: null,
    },
    data: {
      categoryId: input.categoryId,
      name: input.name,
      sku: input.sku,
      cost: input.cost,
      price: input.price,
      stockMin: input.stockMin,
      isActive: input.isActive,
      updatedById: user.id,
    },
  });

  revalidatePath("/app/products");
}
