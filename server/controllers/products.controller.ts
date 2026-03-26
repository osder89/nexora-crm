import type { Request, Response } from "express";

import { Role } from "@prisma/client";

import { parseInitialStock, parseProductInput } from "@/server/domain/products/shared";
import { asyncHandler } from "@/server/middlewares/async-handler";
import { requireRequestTenantActor } from "@/server/middlewares/require-actor";
import { createProduct, createProductCategory, getProductsCatalogData, softDeleteProduct, updateProduct } from "@/server/services/product.service";
import { objectToFormData } from "@/server/utils/form-data";
import { optionalText, requiredText } from "@/server/utils/form";
import { getRouteParam } from "@/server/utils/http";

export const listProductsController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const result = await getProductsCatalogData(actor.tenantId);

  res.json({
    ok: true,
    ...result,
  });
});

export const createProductController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const formData = objectToFormData(req.body);
  const input = parseProductInput(formData);
  const stock = parseInitialStock(formData);
  const product = await createProduct(actor, input, stock);

  res.status(201).json({
    ok: true,
    product,
  });
});

export const updateProductController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const productId = getRouteParam(req, "productId");
  const payload = objectToFormData({
    ...req.body,
    productId,
  });
  const validatedProductId = requiredText(payload, "productId", "Producto invalido.");
  const input = parseProductInput(payload);

  await updateProduct(actor, validatedProductId, input);

  res.json({
    ok: true,
    productId: validatedProductId,
  });
});

export const deleteProductController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req, [Role.ADMIN_EMPRESA]);
  const productId = getRouteParam(req, "productId");

  await softDeleteProduct(actor, productId);

  res.json({
    ok: true,
    productId,
  });
});

export const createCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const formData = objectToFormData(req.body);
  const name = requiredText(formData, "name", "El nombre de categoria es obligatorio.");
  const description = optionalText(formData, "description");
  const isActive = String(formData.get("isActive") ?? "true") === "true";
  const category = await createProductCategory(actor, { name, description, isActive });

  res.status(201).json({
    ok: true,
    category,
  });
});
