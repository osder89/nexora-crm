import type { GetServerSideProps, GetServerSidePropsContext, Redirect } from "next";

import { Role } from "@prisma/client";

import { getPageSessionUser, hasSessionCookie, redirectToLogin, type SessionUser } from "@/services/auth/session.server";
import { buildSuperShellProps, buildTenantShellProps, type AppShellProps, type TenantRole } from "@/services/layouts/app-shell";
import { getTenantSettingsServer } from "@/services/server/settings.service";

export type PagePropsWithShell = {
  appShell: AppShellProps;
};

type GuardedPageResult<P extends Record<string, unknown>> =
  | { props: P }
  | { redirect: Redirect }
  | { notFound: true };

type PageHandler<P extends Record<string, unknown>> = (
  context: GetServerSidePropsContext,
  user: SessionUser,
) => Promise<GuardedPageResult<P>>;

export function withTenantPage<P extends Record<string, unknown>>(
  handler: PageHandler<P>,
  allowedRoles: Role[] = [Role.ADMIN_EMPRESA, Role.VENDEDOR],
): GetServerSideProps<P & PagePropsWithShell> {
  return async (context) => {
    const user = await getPageSessionUser(context);

    if (!user) {
      return { redirect: redirectToLogin(hasSessionCookie(context.req) ? "expired" : undefined) };
    }

    if (!user.tenantId || !allowedRoles.includes(user.role)) {
      return { redirect: redirectToLogin() };
    }

    const tenant = await getTenantSettingsServer(context, user).catch(() => null);

    if (!tenant?.isActive) {
      return { redirect: redirectToLogin() };
    }

    const result = await handler(context, user);

    if ("props" in result) {
      return {
        props: {
          ...result.props,
          appShell: buildTenantShellProps({
            tenantName: tenant.name,
            email: user.email,
            role: user.role as TenantRole,
          }),
        },
      };
    }

    return result;
  };
}

export function withSuperPage<P extends Record<string, unknown>>(
  handler: PageHandler<P>,
): GetServerSideProps<P & PagePropsWithShell> {
  return async (context) => {
    const user = await getPageSessionUser(context);

    if (!user) {
      return { redirect: redirectToLogin(hasSessionCookie(context.req) ? "expired" : undefined) };
    }

    if (user.role !== Role.SUPER_ADMIN) {
      return { redirect: redirectToLogin() };
    }

    const result = await handler(context, user);

    if ("props" in result) {
      return {
        props: {
          ...result.props,
          appShell: buildSuperShellProps(user.email),
        },
      };
    }

    return result;
  };
}
