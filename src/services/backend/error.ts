export class BackendApiError extends Error {
  status: number;
  code: string | null;
  details: unknown;

  constructor(message: string, status: number, code: string | null, details: unknown) {
    super(sanitizeErrorMessage(message) ?? "Error del backend.");
    this.name = "BackendApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function parseBackendResponse(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function getResponseMessage(data: unknown) {
  if (typeof data === "string") {
    return sanitizeErrorMessage(data);
  }

  if (typeof data === "object" && data && "message" in data) {
    const message = (data as { message?: unknown }).message;
    return typeof message === "string" ? sanitizeErrorMessage(message) : null;
  }

  return null;
}

export function getResponseCode(data: unknown) {
  if (typeof data !== "object" || !data || !("code" in data)) {
    return null;
  }

  const code = (data as { code?: unknown }).code;
  return typeof code === "string" && code.trim() ? code : null;
}

export function getBackendErrorMessage(error: unknown, fallback: string) {
  if (error instanceof BackendApiError && error.message.trim().length > 0) {
    return sanitizeErrorMessage(error.message) ?? fallback;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return sanitizeErrorMessage(error.message) ?? fallback;
  }

  return fallback;
}

export function getBackendFieldErrors<T extends Record<string, string | undefined>>(error: unknown): Partial<T> {
  if (!(error instanceof BackendApiError)) {
    return {};
  }

  if (!error.details || typeof error.details !== "object" || !("fieldErrors" in error.details)) {
    return {};
  }

  const fieldErrors = (error.details as { fieldErrors?: unknown }).fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return {};
  }

  return fieldErrors as Partial<T>;
}

export function sanitizeErrorMessage(message: string | null | undefined) {
  if (!message) {
    return null;
  }

  const withLineBreaks = message
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|pre|tr|h1|h2|h3|h4|h5|h6)>/gi, "\n");

  const withoutTags = withLineBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(withoutTags);
  const withoutStack = stripStackTrace(decoded);
  const withoutPrefix = withoutStack.replace(/^[A-Za-z]+Error:\s*/, "");
  const normalized = withoutPrefix.replace(/\s+/g, " ").trim();

  return normalized.length > 0 ? normalized : null;
}

function stripStackTrace(value: string) {
  const stackMatch = value.match(/\s+at\s+(?:async\s+)?[A-Za-z0-9_.$<(]/);

  if (!stackMatch || stackMatch.index === undefined) {
    return value;
  }

  return value.slice(0, stackMatch.index);
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}
