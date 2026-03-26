export type ApplicationErrorOptions = {
  code?: string;
  statusCode?: number;
};

export class ApplicationError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, options: ApplicationErrorOptions = {}) {
    super(message);
    this.name = "ApplicationError";
    this.code = options.code ?? "APPLICATION_ERROR";
    this.statusCode = options.statusCode ?? 500;
  }
}