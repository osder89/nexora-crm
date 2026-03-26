import type { GetServerSidePropsContext } from "next";

import { type SessionUser } from "@/services/auth/session.server";
import { serverBackendRequest } from "@/services/backend/server-request";

export type TenantSettings = {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  email: string | null;
  phone: string | null;
  nit: string | null;
  address: string | null;
  isActive: boolean;
};

export async function getTenantSettingsServer(context: GetServerSidePropsContext, user?: SessionUser | null) {
  const response = await serverBackendRequest<{ ok: true; tenant: TenantSettings }>(context, "/settings/tenant", {
    user,
  });
  return response.tenant;
}

