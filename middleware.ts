import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string | undefined;
  const tenantId = (token.tenantId as string | null | undefined) ?? null;

  if (pathname.startsWith("/super")) {
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/app/dashboard", req.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/app")) {
    if (role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/super/tenants", req.url));
    }

    const isTenantRole = role === "ADMIN_EMPRESA" || role === "VENDEDOR";

    if (!isTenantRole || !tenantId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/super/:path*", "/app/:path*"],
};

