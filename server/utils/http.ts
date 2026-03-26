import type { Request } from "express";

import { ApplicationError } from "@/server/base/errors/application.error";

export function getRouteParam(req: Request, name: string) {
  const value = req.params[name];

  if (typeof value !== "string" || !value.trim()) {
    throw new ApplicationError(`Parametro de ruta invalido: ${name}.`, {
      code: "INVALID_ROUTE_PARAM",
      statusCode: 422,
    });
  }

  return value;
}
