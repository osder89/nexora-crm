import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/services/auth/auth-options";
import { BACKEND_API_URL, buildActorHeaders } from "@/services/backend/shared";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");

  const path = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;

  if (!path) {
    res.status(400).json({
      message: "Ruta invalida.",
    });
    return;
  }

  const session = await getServerSession(req, res, authOptions);
  const user =
    session?.user?.id && session.user.email && session.user.role
      ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          tenantId: session.user.tenantId ?? null,
        }
      : null;

  const searchParams = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(req.query)) {
    if (key === "path") {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        searchParams.append(key, value);
      }
      continue;
    }

    if (typeof rawValue === "string") {
      searchParams.set(key, rawValue);
    }
  }

  const url = new URL(`${BACKEND_API_URL}/${path}`);
  url.search = searchParams.toString();

  const headers = new Headers({
    Accept: "application/json",
    ...buildActorHeaders(user),
  });

  const method = normalizeMethod(req.method);
  const init: RequestInit = {
    method,
    headers,
  };

  const normalizedBody = normalizeProxyBody(req.body);

  if (method !== "GET" && method !== "DELETE" && normalizedBody !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(normalizedBody);
  }

  const response = await fetch(url, init);
  const text = await response.text();

  if (text) {
    const contentType = response.headers.get("content-type") ?? "application/json";
    res.status(response.status);
    res.setHeader("content-type", contentType);
    res.send(text);
    return;
  }

  res.status(response.status).end();
}

function normalizeMethod(method?: string) {
  if (!method) {
    return "GET";
  }

  const normalized = method.toUpperCase();
  if (normalized === "GET" || normalized === "POST" || normalized === "PUT" || normalized === "PATCH" || normalized === "DELETE") {
    return normalized;
  }

  return "GET";
}

function normalizeProxyBody(body: NextApiRequest["body"]) {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === "string") {
    return body.trim().length > 0 ? body : undefined;
  }

  if (Array.isArray(body)) {
    return body.length > 0 ? body : undefined;
  }

  if (typeof body === "object") {
    return Object.keys(body).length > 0 ? body : undefined;
  }

  return body;
}
