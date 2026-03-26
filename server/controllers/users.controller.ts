import type { Request, Response } from "express";

import { Role } from "@prisma/client";

import { asyncHandler } from "@/server/middlewares/async-handler";
import { requireRequestTenantActor } from "@/server/middlewares/require-actor";
import { createVendor, getTenantUsersData, toggleTenantUserStatus } from "@/server/services/user.service";
import { objectToFormData } from "@/server/utils/form-data";
import { requiredText } from "@/server/utils/form";
import { getRouteParam } from "@/server/utils/http";

export const listUsersController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const result = await getTenantUsersData(actor.tenantId);

  res.json({
    ok: true,
    ...result,
  });
});

export const createVendorController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req, [Role.ADMIN_EMPRESA]);
  const formData = objectToFormData(req.body);
  const email = requiredText(formData, "email", "Email requerido.").toLowerCase();
  const password = requiredText(formData, "password", "Password requerido.");
  const user = await createVendor(actor, { email, password });

  res.status(201).json({
    ok: true,
    user,
  });
});

export const toggleVendorStatusController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req, [Role.ADMIN_EMPRESA]);
  const formData = objectToFormData({
    userId: getRouteParam(req, "userId"),
    nextState: req.body.nextState,
  });
  const userId = requiredText(formData, "userId", "Usuario invalido.");
  const nextState = requiredText(formData, "nextState", "Estado invalido.") === "true";

  await toggleTenantUserStatus(actor, userId, nextState);

  res.json({
    ok: true,
    userId,
  });
});
