import type { IncomingHttpHeaders } from "http";

import type { SessionUser } from "@/services/auth/session.server";
import { resolveAuthBaseUrl } from "@/services/auth/env";

export type BackendRequestQuery = URLSearchParams | Record<string, string | number | boolean | null | undefined>;

export function buildApiPath(path: string, query?: BackendRequestQuery) {
  const basePath = path.startsWith("/api") ? path : path.startsWith("/") ? `/api${path}` : `/api/${path}`;
  const url = new URL(basePath, "http://internal.local");

  if (query instanceof URLSearchParams) {
    url.search = query.toString();
    return `${url.pathname}${url.search}`;
  }

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return `${url.pathname}${url.search}`;
}

export function buildServerApiUrl(headers: IncomingHttpHeaders, path: string, query?: BackendRequestQuery) {
  const origin = resolveRequestOrigin(headers);
  return new URL(buildApiPath(path, query), origin).toString();
}

export function buildActorHeaders(user: SessionUser | null) {
  if (!user) {
    return {};
  }

  return {
    "x-user-id": user.id,
    "x-user-email": user.email,
    "x-user-role": user.role,
    ...(user.tenantId ? { "x-tenant-id": user.tenantId } : {}),
  };
}

function resolveRequestOrigin(headers: IncomingHttpHeaders) {
  const forwardedProto = getHeaderValue(headers, "x-forwarded-proto");
  const forwardedHost = getHeaderValue(headers, "x-forwarded-host");
  const host = forwardedHost ?? getHeaderValue(headers, "host") ?? resolveFallbackHost();
  const protocol = forwardedProto ?? resolveFallbackProtocol();

  return `${protocol}://${host}`;
}

function getHeaderValue(headers: IncomingHttpHeaders, key: string) {
  const value = headers[key];

  if (Array.isArray(value)) {
    return value[0]?.split(",")[0]?.trim() || null;
  }

  if (typeof value === "string") {
    return value.split(",")[0]?.trim() || null;
  }

  return null;
}

function resolveFallbackHost() {
  const authBaseUrl = resolveAuthBaseUrl();

  if (authBaseUrl) {
    return new URL(authBaseUrl).host;
  }

  return "localhost:4200";
}

function resolveFallbackProtocol() {
  const authBaseUrl = resolveAuthBaseUrl();

  if (authBaseUrl) {
    return new URL(authBaseUrl).protocol.replace(":", "");
  }

  return process.env.NODE_ENV === "production" ? "https" : "http";
}
