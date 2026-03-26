import type { GetServerSidePropsContext } from "next";

import { serverBackendRequest } from "@/services/backend/server-request";

export type SuperTenant = {
  id: string;
  name: string;
  nit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  isActive: boolean;
  users: Array<{
    id: string;
    email: string;
    isActive: boolean;
  }>;
  _count: {
    users: number;
    customers: number;
    products: number;
    sales: number;
  };
};

export async function getSuperTenantsServer(context: GetServerSidePropsContext) {
  const response = await serverBackendRequest<{ ok: true; tenants: SuperTenant[] }>(context, "/super/tenants");
  return response.tenants;
}

