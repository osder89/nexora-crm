import type { NextFunction, Request, Response } from "express";

import { ApplicationError } from "@/server/base/errors/application.error";
import { CustomerValidationError } from "@/server/domain/customers/shared";

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  void next;

  if (error instanceof CustomerValidationError) {
    return res.status(422).json({
      ok: false,
      code: "CUSTOMER_VALIDATION_ERROR",
      message: error.message,
      fieldErrors: error.fieldErrors,
    });
  }

  if (error instanceof ApplicationError) {
    return res.status(error.statusCode).json({
      ok: false,
      code: error.code,
      message: error.message,
    });
  }

  const fallbackMessage = error instanceof Error ? error.message : "Error interno del servidor.";

  return res.status(500).json({
    ok: false,
    code: "INTERNAL_SERVER_ERROR",
    message: fallbackMessage,
  });
}
