type RouteAccessInput = {
  pathname: string;
  role?: string | null;
  tenantId?: string | null;
};

export function resolveProtectedRouteRedirect({ pathname, role, tenantId }: RouteAccessInput) {
  if (pathname.startsWith("/super")) {
    return role === "SUPER_ADMIN" ? null : "/app/dashboard";
  }

  if (pathname.startsWith("/app")) {
    if (role === "SUPER_ADMIN") {
      return "/super/tenants";
    }

    const isTenantRole = role === "ADMIN_EMPRESA" || role === "VENDEDOR";
    return isTenantRole && tenantId ? null : "/login";
  }

  return null;
}

