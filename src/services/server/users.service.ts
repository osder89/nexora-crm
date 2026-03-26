import type { GetServerSidePropsContext } from "next";

import { serverBackendRequest } from "@/services/backend/server-request";

export type TenantUser = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
};

export async function getTenantUsersServer(context: GetServerSidePropsContext) {
  const response = await serverBackendRequest<{ ok: true; users: TenantUser[] }>(context, "/users");
  return response.users;
}

