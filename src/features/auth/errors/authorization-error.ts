export class AuthorizationError extends Error {
  readonly code = "AUTHORIZATION_ERROR";
  readonly statusCode = 403;

  constructor(message = "No autorizado") {
    super(message);
    this.name = "AuthorizationError";
  }
}

