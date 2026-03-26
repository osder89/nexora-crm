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

export function buildServerApiUrl(path: string, query?: BackendRequestQuery) {
  const port = resolveInternalPort();
  return new URL(buildApiPath(path, query), `http://127.0.0.1:${port}`).toString();
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

function resolveInternalPort() {
  const directPort = process.env.PORT?.trim();

  if (directPort) {
    return directPort;
  }

  const authBaseUrl = resolveAuthBaseUrl();

  if (authBaseUrl) {
    const nextAuthUrl = new URL(authBaseUrl);
    if (nextAuthUrl.port) {
      return nextAuthUrl.port;
    }
  }

  return "4200";
}
