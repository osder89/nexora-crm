

import type { ProductInput } from "@/server/domain/products/shared";
import type { PrismaDbClient } from "@/server/repositories/prisma";

export async function findActiveProductById(db: PrismaDbClient, tenantId: string, productId: string) {
  return db.product.findFirst({
    where: {
      id: productId,
      tenantId,
      deletedAt: null,
    },
    select: { id: true },
  });
}

export async function findActiveProductBySku(db: PrismaDbClient, tenantId: string, sku: string, excludeProductId?: string) {
  return db.product.findFirst({
    where: {
      tenantId,
      sku,
      deletedAt: null,
      ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
    },
    select: { id: true },
  });
}

export async function findActiveCategoryById(db: PrismaDbClient, tenantId: string, categoryId: string) {
  return db.productCategory.findFirst({
    where: {
      id: categoryId,
      tenantId,
      deletedAt: null,
      isActive: true,
    },
    select: { id: true },
  });
}

export async function findActiveCategoryByName(db: PrismaDbClient, tenantId: string, name: string) {
  return db.productCategory.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });
}

export async function createProductRecord(
  db: PrismaDbClient,
  actor: { id: string; tenantId: string },
  input: ProductInput,
  stock: number,
) {
  return db.product.create({
    data: {
      tenantId: actor.tenantId,
      categoryId: input.categoryId,
      name: input.name,
      sku: input.sku,
      cost: input.cost,
      price: input.price,
      stock,
      stockMin: input.stockMin,
      isActive: input.isActive,
      createdById: actor.id,
      updatedById: actor.id,
    },
  });
}

export async function updateProductRecord(
  db: PrismaDbClient,
  actor: { id: string; tenantId: string },
  productId: string,
  input: ProductInput,
) {
  return db.product.updateMany({
    where: {
      id: productId,
      tenantId: actor.tenantId,
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
      updatedById: actor.id,
    },
  });
}

export async function softDeleteProductRecord(db: PrismaDbClient, actor: { id: string; tenantId: string }, productId: string) {
  return db.product.updateMany({
    where: {
      id: productId,
      tenantId: actor.tenantId,
      deletedAt: null,
    },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deletedById: actor.id,
      updatedById: actor.id,
    },
  });
}

export async function createCategoryRecord(
  db: PrismaDbClient,
  actor: { id: string; tenantId: string },
  input: { name: string; description: string | null; isActive: boolean },
) {
  return db.productCategory.create({
    data: {
      tenantId: actor.tenantId,
      name: input.name,
      description: input.description,
      isActive: input.isActive,
      createdById: actor.id,
      updatedById: actor.id,
    },
  });
}

export async function listProducts(db: PrismaDbClient, tenantId: string) {
  return db.product.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listCategories(db: PrismaDbClient, tenantId: string) {
  return db.productCategory.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    orderBy: { name: "asc" },
  });
}
