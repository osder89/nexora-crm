import type { Request, Response } from "express";

import { Role } from "@prisma/client";

import { parseCustomerInput } from "@/server/domain/customers/shared";
import { asyncHandler } from "@/server/middlewares/async-handler";
import { requireRequestTenantActor } from "@/server/middlewares/require-actor";
import { createCustomer, getCustomerDetailData, getCustomersPageData, softDeleteCustomer, updateCustomer } from "@/server/services/customer.service";
import { objectToFormData } from "@/server/utils/form-data";
import { requiredText } from "@/server/utils/form";
import { getRouteParam } from "@/server/utils/http";

export const listCustomersController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const status = req.query.status === "active" || req.query.status === "inactive" ? req.query.status : "all";
  const page = Math.max(1, Number.parseInt(typeof req.query.page === "string" ? req.query.page : "1", 10) || 1);
  const take = Math.max(1, Number.parseInt(typeof req.query.take === "string" ? req.query.take : "10", 10) || 10);
  const skip = (page - 1) * take;

  const result = await getCustomersPageData(actor.tenantId, {
    q,
    status,
    skip,
    take,
  });

  res.json({
    ok: true,
    ...result,
    page,
    take,
  });
});

export const getCustomerController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const customerId = getRouteParam(req, "customerId");
  const customer = await getCustomerDetailData(actor.tenantId, customerId);

  res.json({
    ok: true,
    customer,
  });
});

export const createCustomerController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const formData = objectToFormData(req.body);
  const input = parseCustomerInput(formData);
  const customer = await createCustomer(actor, input);

  res.status(201).json({
    ok: true,
    customer,
  });
});

export const updateCustomerController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req);
  const customerId = getRouteParam(req, "customerId");
  const payload = objectToFormData({
    ...req.body,
    customerId,
  });
  const input = parseCustomerInput(payload);

  await updateCustomer(actor, customerId, input);

  res.json({
    ok: true,
    customerId,
  });
});

export const deleteCustomerController = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireRequestTenantActor(req, [Role.ADMIN_EMPRESA]);
  const customerId = requiredText(objectToFormData({ customerId: getRouteParam(req, "customerId") }), "customerId", "Cliente invalido.");

  await softDeleteCustomer(actor, customerId);

  res.json({
    ok: true,
    customerId,
  });
});
