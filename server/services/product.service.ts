import { Role } from "@prisma/client";

import { ApplicationError } from "@/server/base/errors/application.error";
import type { ProductInput } from "@/server/domain/products/shared";
import { prisma } from "@/server/repositories/prisma";
import {
  createCategoryRecord,
  createProductRecord,
  findActiveCategoryById,
  findActiveCategoryByName,
  findActiveProductById,
  findActiveProductBySku,
  listCategories,
  listProducts,
  softDeleteProductRecord,
  updateProductRecord,
} from "@/server/repositories/product.repository";
import type { TenantActor } from "@/server/types/actor";

export async function createProduct(actor: TenantActor, input: ProductInput, stock: number) {
  await assertUniqueProductSku(actor.tenantId, input.sku);
  await assertValidCategory(actor.tenantId, input.categoryId);

  return createProductRecord(prisma, actor, input, stock);
}

export async function updateProduct(actor: TenantActor, productId: string, input: ProductInput) {
  const product = await findActiveProductById(prisma, actor.tenantId, productId);
  if (!product) {
    throw new ApplicationError("Producto no encontrado.", {
      code: "PRODUCT_NOT_FOUND",
      statusCode: 404,
    });
  }

  await assertUniqueProductSku(actor.tenantId, input.sku, productId);
  await assertValidCategory(actor.tenantId, input.categoryId);

  await updateProductRecord(prisma, actor, productId, input);
}

export async function softDeleteProduct(actor: TenantActor, productId: string) {
  if (actor.role !== Role.ADMIN_EMPRESA) {
    throw new ApplicationError("No autorizado.", {
      code: "AUTHORIZATION_ERROR",
      statusCode: 403,
    });
  }

  const updated = await softDeleteProductRecord(prisma, actor, productId);

  if (updated.count === 0) {
    throw new ApplicationError("Producto no encontrado o ya eliminado.", {
      code: "PRODUCT_NOT_FOUND",
      statusCode: 404,
    });
  }
}

export async function createProductCategory(
  actor: TenantActor,
  input: { name: string; description: string | null; isActive: boolean },
) {
  const existing = await findActiveCategoryByName(prisma, actor.tenantId, input.name);

  if (existing) {
    throw new ApplicationError("Ya existe una categoria activa con ese nombre.", {
      code: "CATEGORY_DUPLICATED",
      statusCode: 409,
    });
  }

  return createCategoryRecord(prisma, actor, input);
}

export async function getProductsCatalogData(tenantId: string) {
  const [products, categories] = await Promise.all([listProducts(prisma, tenantId), listCategories(prisma, tenantId)]);

  return {
    products,
    categories,
  };
}

async function assertUniqueProductSku(tenantId: string, sku: string | null, excludeProductId?: string) {
  if (!sku) {
    return;
  }

  const duplicate = await findActiveProductBySku(prisma, tenantId, sku, excludeProductId);

  if (duplicate) {
    throw new ApplicationError("El SKU ya existe en este tenant.", {
      code: "PRODUCT_SKU_DUPLICATED",
      statusCode: 409,
    });
  }
}

async function assertValidCategory(tenantId: string, categoryId: string | null) {
  if (!categoryId) {
    return;
  }

  const category = await findActiveCategoryById(prisma, tenantId, categoryId);

  if (!category) {
    throw new ApplicationError("Categoria invalida o inactiva.", {
      code: "CATEGORY_INVALID",
      statusCode: 422,
    });
  }
}
