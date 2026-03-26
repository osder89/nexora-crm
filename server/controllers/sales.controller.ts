import type { Request, Response } from "express";

import { ValidationError } from "@/server/base/errors/validation.error";
import { normalizePaymentMethod, parseCreditConfig, parseSaleItems, parseSaleType } from "@/server/domain/sales/shared";
import { asyncHandler } from "@/server/middlewares/async-handler";
import { requireRequestTenantActor } from "@/server/middlewares/require-actor";
import { cancelSale, createPayment, createSale, getSaleDetailData, getSalesData } from "@/server/services/sale-management.service";
import { objectToFormData } from "@/server/utils/form-data";
import { optionalText, requiredNumber, requiredText } from "@/server/utils/form";
import { getRouteParam } from "@/server/utils/http";

export const listSalesController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const result = await getSalesData(actor.tenantId);

  res.json({
    ok: true,
    ...result,
  });
});

export const getSaleController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const saleId = getRouteParam(req, "saleId");
  const sale = await getSaleDetailData(actor.tenantId, saleId);

  res.json({
    ok: true,
    sale,
  });
});

export const createSaleController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const formData = objectToFormData(req.body);
  const customerId = optionalText(formData, "customerId");
  const notes = optionalText(formData, "notes");
  const saleType = parseSaleType(formData);
  const requestedQuantities = parseSaleItems(formData);
  const cashMethod = normalizePaymentMethod(optionalText(formData, "cashMethod"));

  const result =
    saleType === "CREDITO"
      ? await createSale(actor, {
          customerId,
          notes,
          saleType,
          requestedQuantities,
          cashMethod,
          credit: parseCreditConfig(formData),
        })
      : await createSale(actor, {
          customerId,
          notes,
          saleType,
          requestedQuantities,
          cashMethod,
        });

  res.status(201).json({
    ok: true,
    sale: result.sale,
    lowStockProducts: result.lowStockProducts,
  });
});

export const createSalePaymentController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const formData = objectToFormData({
    ...req.body,
    saleId: getRouteParam(req, "saleId"),
  });
  const saleId = requiredText(formData, "saleId", "Venta invalida.");
  const amount = requiredNumber(formData, "amount", "Monto invalido.");
  const method = normalizePaymentMethod(requiredText(formData, "method", "Metodo invalido."));
  const note = optionalText(formData, "note");
  const paidAtInput = optionalText(formData, "paidAt");

  if (amount <= 0) {
    throw new ValidationError("El monto debe ser mayor a cero.");
  }

  await createPayment(actor, {
    saleId,
    amount,
    method,
    note,
    paidAt: paidAtInput ? new Date(`${paidAtInput}T00:00:00`) : new Date(),
  });

  res.json({
    ok: true,
    saleId,
  });
});

export const cancelSaleController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const formData = objectToFormData({
    ...req.body,
    saleId: getRouteParam(req, "saleId"),
  });
  const saleId = requiredText(formData, "saleId", "Venta invalida.");
  const cancelReason = optionalText(formData, "cancelReason");

  await cancelSale(actor, saleId, cancelReason);

  res.json({
    ok: true,
    saleId,
  });
});
