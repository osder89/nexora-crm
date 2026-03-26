import type { GetServerSidePropsContext } from "next";

import { type SessionUser, getPageSessionUser } from "@/services/auth/session.server";
import { BackendApiError, getResponseCode, getResponseMessage, parseBackendResponse } from "@/services/backend/error";
import { type BackendRequestQuery, buildActorHeaders, buildServerApiUrl } from "@/services/backend/shared";

type ServerBackendRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: BackendRequestQuery;
  user?: SessionUser | null;
};

export async function serverBackendRequest<T>(
  context: GetServerSidePropsContext,
  path: string,
  options: ServerBackendRequestOptions = {},
) {
  const user = options.user === undefined ? await getPageSessionUser(context) : options.user;
  const url = buildServerApiUrl(context.req.headers, path, options.query);
  const headers = new Headers({
    Accept: "application/json",
    ...buildActorHeaders(user),
  });
  const cookieHeader = context.req.headers.cookie;

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    cache: "no-store",
  };

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);
  const text = await response.text();
  const data = parseBackendResponse(text);

  if (!response.ok) {
    throw new BackendApiError(
      getResponseMessage(data) ?? `Backend request failed: ${response.status}`,
      response.status,
      getResponseCode(data),
      data,
    );
  }

  return data as T;
}
