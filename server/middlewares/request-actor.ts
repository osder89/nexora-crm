import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { getToken } from "next-auth/jwt";

import { resolveAuthSecret, resolveSecureCookiePreference } from "@/services/auth/env";
import type { AppActor } from "@/server/types/actor";

export async function attachRequestActor(req: Request, _res: Response, next: NextFunction) {
  req.actor = await resolveRequestActor(req);
  next();
}

async function resolveRequestActor(req: Request): Promise<AppActor | null> {
  const tokenActor = await resolveActorFromNextAuth(req);
  if (tokenActor) {
    return tokenActor;
  }

  const role = normalizeRole(req.header("x-user-role"));
  const id = req.header("x-user-id");
  const email = req.header("x-user-email");
  const tenantId = req.header("x-tenant-id");

  if (!role || !id || !email) {
    return null;
  }

  return {
    id,
    email,
    role,
    tenantId: tenantId?.trim() ? tenantId : null,
  };
}

async function resolveActorFromNextAuth(req: Request): Promise<AppActor | null> {
  try {
    const token = await getToken({
      req: req as Parameters<typeof getToken>[0]["req"],
      secret: resolveAuthSecret() ?? undefined,
      secureCookie: resolveSecureCookiePreference(req.header("x-forwarded-proto") ?? (req.secure ? "https" : req.protocol)),
    });

    const role = normalizeRole(typeof token?.role === "string" ? token.role : null);
    const id = typeof token?.sub === "string" ? token.sub : null;
    const email = typeof token?.email === "string" ? token.email : null;
    const tenantId = typeof token?.tenantId === "string" ? token.tenantId : null;

    if (!role || !id || !email) {
      return null;
    }

    return {
      id,
      email,
      role,
      tenantId,
    };
  } catch {
    return null;
  }
}

function normalizeRole(value: string | null | undefined) {
  if (value === Role.SUPER_ADMIN || value === Role.ADMIN_EMPRESA || value === Role.VENDEDOR) {
    return value;
  }

  return null;
}
