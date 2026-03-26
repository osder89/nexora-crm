import { buildApiPath } from "@/services/backend/shared";
import { BackendApiError, getResponseCode, getResponseMessage, parseBackendResponse } from "@/services/backend/error";

type ClientBackendRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: URLSearchParams | Record<string, string | number | boolean | null | undefined>;
};

export async function clientBackendRequest<T>(path: string, options: ClientBackendRequestOptions = {}) {
  const url = buildApiPath(path, options.query);
  const headers = new Headers({
    Accept: "application/json",
  });

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
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
