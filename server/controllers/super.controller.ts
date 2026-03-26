import type { Request, Response } from "express";

import { ValidationError } from "@/server/base/errors/validation.error";
import { asyncHandler } from "@/server/middlewares/async-handler";
import { requireRequestSuperAdmin } from "@/server/middlewares/require-actor";
import { createTenant, createTenantAdmin, getTenantsData, toggleTenantStatus } from "@/server/services/super-admin.service";
import { objectToFormData } from "@/server/utils/form-data";
import { optionalText } from "@/server/utils/form";
import { getRouteParam } from "@/server/utils/http";

export const listTenantsController = asyncHandler(async (req: Request, res: Response) => {
  requireRequestSuperAdmin(req);
  const result = await getTenantsData();

  res.json({
    ok: true,
    ...result,
  });
});

export const createTenantController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestSuperAdmin(req);
  const formData = objectToFormData(req.body);
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new ValidationError("El nombre de empresa es obligatorio.");
  }

  const tenant = await createTenant(actor, {
    name,
    nit: optionalText(formData, "nit"),
    phone: optionalText(formData, "phone"),
    email: optionalText(formData, "email")?.toLowerCase() ?? null,
    address: optionalText(formData, "address"),
    logoUrl: optionalText(formData, "logoUrl"),
    primaryColor: optionalText(formData, "primaryColor"),
  });

  res.status(201).json({
    ok: true,
    tenant,
  });
});

export const toggleTenantStatusController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestSuperAdmin(req);
  const tenantId = getRouteParam(req, "tenantId");
  const nextState = Boolean(req.body.nextState === true || req.body.nextState === "true");

  await toggleTenantStatus(actor, tenantId, nextState);

  res.json({
    ok: true,
    tenantId,
  });
});

export const createTenantAdminController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestSuperAdmin(req);
  const tenantId = getRouteParam(req, "tenantId");
  const formData = objectToFormData({
    ...req.body,
    tenantId,
  });
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!tenantId || !email || !password) {
    throw new ValidationError("Tenant, email y password son obligatorios.");
  }

  const user = await createTenantAdmin(actor, { tenantId, email, password });

  res.status(201).json({
    ok: true,
    user,
  });
});
