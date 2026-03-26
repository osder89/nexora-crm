import type { SessionUser } from "@/services/auth/session.server";

export const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:4300/api";

export type BackendRequestQuery = URLSearchParams | Record<string, string | number | boolean | null | undefined>;

export function buildBackendUrl(path: string, query?: BackendRequestQuery) {
  const basePath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${BACKEND_API_URL}${basePath}`);

  if (query instanceof URLSearchParams) {
    url.search = query.toString();
    return url.toString();
  }

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
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

