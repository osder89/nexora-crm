import { ApplicationError } from "@/server/base/errors/application.error";

export class ValidationError extends ApplicationError {
  constructor(message: string, code = "VALIDATION_ERROR") {
    super(message, {
      code,
      statusCode: 422,
    });

    this.name = "ValidationError";
  }
}
