import { ApplicationError } from "@/server/base/errors/application.error";

export class AuthorizationError extends ApplicationError {
  constructor(message = "No autorizado") {
    super(message, {
      code: "AUTHORIZATION_ERROR",
      statusCode: 403,
    });

    this.name = "AuthorizationError";
  }
}