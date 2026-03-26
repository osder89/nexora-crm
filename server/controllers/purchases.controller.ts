import type { Request, Response } from "express";

import { Role } from "@prisma/client";

import { parsePurchaseItems, requiredPurchaseId } from "@/server/domain/purchases/shared";
import { asyncHandler } from "@/server/middlewares/async-handler";
import { requireRequestTenantActor } from "@/server/middlewares/require-actor";
import { cancelPurchase, createPurchase, createSupplier, getPurchaseDetailData, getPurchasesData, receivePurchase } from "@/server/services/purchase.service";
import { objectToFormData } from "@/server/utils/form-data";
import { optionalText, requiredText } from "@/server/utils/form";
import { getRouteParam } from "@/server/utils/http";

export const listPurchasesController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const result = await getPurchasesData(actor.tenantId);

  res.json({
    ok: true,
    ...result,
  });
});

export const getPurchaseController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const purchaseId = getRouteParam(req, "purchaseId");
  const purchase = await getPurchaseDetailData(actor.tenantId, purchaseId);

  res.json({
    ok: true,
    purchase,
  });
});

export const createSupplierController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req, [Role.ADMIN_EMPRESA]);
  const formData = objectToFormData(req.body);
  const name = requiredText(formData, "name", "Nombre del proveedor obligatorio.");
  const nit = optionalText(formData, "nit");
  const phone = optionalText(formData, "phone");
  const email = optionalText(formData, "email");
  const address = optionalText(formData, "address");
  const notes = optionalText(formData, "notes");
  const supplier = await createSupplier(actor, { name, nit, phone, email, address, notes });

  res.status(201).json({
    ok: true,
    supplier,
  });
});

export const createPurchaseController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req, [Role.ADMIN_EMPRESA]);
  const formData = objectToFormData(req.body);
  const supplierId = requiredText(formData, "supplierId", "Proveedor invalido.");
  const notes = optionalText(formData, "notes");
  const expectedAtRaw = optionalText(formData, "expectedAt");
  const expectedAt = expectedAtRaw ? new Date(`${expectedAtRaw}T00:00:00`) : null;
  const requestedItems = parsePurchaseItems(formData);
  const purchase = await createPurchase(actor, { supplierId, notes, expectedAt, requestedItems });

  res.status(201).json({
    ok: true,
    purchase,
  });
});

export const receivePurchaseController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req, [Role.ADMIN_EMPRESA]);
  const formData = objectToFormData({ purchaseId: getRouteParam(req, "purchaseId") });
  const purchaseId = requiredPurchaseId(formData);

  await receivePurchase(actor, purchaseId);

  res.json({
    ok: true,
    purchaseId,
  });
});

export const cancelPurchaseController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req, [Role.ADMIN_EMPRESA]);
  const formData = objectToFormData({
    ...req.body,
    purchaseId: getRouteParam(req, "purchaseId"),
  });
  const purchaseId = requiredPurchaseId(formData);
  const reason = optionalText(formData, "cancelReason");

  await cancelPurchase(actor, purchaseId, reason);

  res.json({
    ok: true,
    purchaseId,
  });
});
