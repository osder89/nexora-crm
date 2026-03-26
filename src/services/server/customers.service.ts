import type { GetServerSidePropsContext } from "next";

import { PaymentMethod, SaleStatus } from "@prisma/client";

import { serverBackendRequest } from "@/services/backend/server-request";

type CustomerSaleSummary = {
  total: number | string;
  balance: number | string;
};

export type CustomerListItem = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  nit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  sales: CustomerSaleSummary[];
};

export type CustomerDetail = Omit<CustomerListItem, "sales"> & {
  deletedAt: string | null;
  sales: Array<{
    id: string;
    createdAt: string;
    status: SaleStatus;
    total: number | string;
    balance: number | string;
    payments: Array<{
      id: string;
      amount: number | string;
      method: PaymentMethod;
      paidAt: string;
    }>;
  }>;
};

export async function getCustomersPageServer(
  context: GetServerSidePropsContext,
  params: {
    q?: string;
    status?: "all" | "active" | "inactive";
    page: number;
    take: number;
  },
) {
  return serverBackendRequest<{
    ok: true;
    totalCustomers: number;
    customers: CustomerListItem[];
    page: number;
    take: number;
  }>(context, "/customers", {
    query: {
      q: params.q ?? "",
      status: params.status ?? "all",
      page: params.page,
      take: params.take,
    },
  });
}

export async function getCustomerDetailServer(context: GetServerSidePropsContext, customerId: string) {
  const response = await serverBackendRequest<{ ok: true; customer: CustomerDetail }>(context, `/customers/${customerId}`);
  return response.customer;
}

export async function getActiveCustomerOptionsServer(context: GetServerSidePropsContext, take = 200) {
  const response = await getCustomersPageServer(context, {
    status: "active",
    page: 1,
    take,
  });

  return response.customers.filter((customer) => customer.isActive);
}

