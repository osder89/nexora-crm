import type { Request, Response } from "express";

import { asyncHandler } from "@/server/middlewares/async-handler";
import { requireRequestTenantActor } from "@/server/middlewares/require-actor";
import { updateTenantSettings, getTenantSettingsData } from "@/server/services/tenant-settings.service";
import { objectToFormData } from "@/server/utils/form-data";
import { optionalText, requiredText } from "@/server/utils/form";

export const getTenantSettingsController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const result = await getTenantSettingsData(actor.tenantId);

  res.json({
    ok: true,
    ...result,
  });
});

export const updateTenantSettingsController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const formData = objectToFormData(req.body);
  const name = requiredText(formData, "name", "El nombre comercial es obligatorio.");
  const logoUrl = optionalText(formData, "logoUrl");
  const primaryColor = optionalText(formData, "primaryColor");
  const tenant = await updateTenantSettings(actor, { name, logoUrl, primaryColor });

  res.json({
    ok: true,
    tenant,
  });
});
