import type { Request, Response } from "express";

import { asyncHandler } from "@/server/middlewares/async-handler";
import { requireRequestTenantActor } from "@/server/middlewares/require-actor";
import { createCollectionLog, getReceivablesData } from "@/server/services/receivable.service";
import { objectToFormData } from "@/server/utils/form-data";
import { optionalDate, requiredText } from "@/server/utils/form";

export const listReceivablesController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const result = await getReceivablesData(actor.tenantId);

  res.json({
    ok: true,
    ...result,
  });
});

export const createCollectionLogController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const formData = objectToFormData(req.body);
  const saleId = requiredText(formData, "saleId", "Venta invalida.");
  const comment = requiredText(formData, "comment", "Comentario obligatorio.");
  const nextContactAt = optionalDate(formData, "nextContactAt");

  await createCollectionLog(actor, { saleId, comment, nextContactAt });

  res.status(201).json({
    ok: true,
    saleId,
  });
});
