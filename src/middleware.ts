import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { resolveProtectedRouteRedirect } from "@/features/auth/route-access";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (!token?.sub || !token.role) {
    const loginUrl = new URL("/login", req.url);

    if (hasSessionCookie(req)) {
      loginUrl.searchParams.set("reason", "expired");
    }

    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string | undefined;
  const tenantId = (token.tenantId as string | null | undefined) ?? null;
  const redirectPath = resolveProtectedRouteRedirect({ pathname, role, tenantId });

  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  return NextResponse.next();
}

function hasSessionCookie(req: NextRequest) {
  return req.cookies.has("next-auth.session-token") || req.cookies.has("__Secure-next-auth.session-token");
}

export const config = {
  matcher: ["/super/:path*", "/app/:path*"],
};
