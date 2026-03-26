import type { GetServerSidePropsContext } from "next";

import { InstallmentStatus, PaymentMethod, SaleStatus, SaleType } from "@prisma/client";

import { getActiveCustomerOptionsServer, type CustomerListItem } from "@/services/server/customers.service";
import { getProductsCatalogServer, type ProductListItem } from "@/services/server/products.service";
import { serverBackendRequest } from "@/services/backend/server-request";

export type SaleListItem = {
  id: string;
  createdAt: string;
  saleType: SaleType;
  installmentCount: number | null;
  installmentFrequencyDays: number | null;
  total: number | string;
  balance: number | string;
  status: SaleStatus;
  dueDate: string | null;
  customer: {
    id?: string;
    name: string;
    firstName: string;
    lastName: string;
    nit?: string | null;
  } | null;
  seller: {
    id?: string;
    email: string;
  };
  payments: Array<{
    id: string;
    amount: number | string;
    method: PaymentMethod;
    paidAt: string;
    note: string | null;
  }>;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    subtotal: number | string;
    product: {
      id: string;
      name: string;
    };
  }>;
  installments: Array<{
    id: string;
    installmentNumber: number;
    amount: number | string;
    paidAmount: number | string;
    dueDate: string;
    status: InstallmentStatus;
  }>;
};

export type SaleDetail = SaleListItem & {
  notes: string | null;
  collectionLogs: Array<{
    id: string;
    comment: string;
    nextContactAt: string | null;
    createdAt: string;
    createdBy: {
      email: string;
    };
  }>;
};

export type SellerOption = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
};

export async function getSalesDataServer(context: GetServerSidePropsContext) {
  return serverBackendRequest<{ ok: true; sales: SaleListItem[] }>(context, "/sales");
}

export async function getSaleDetailServer(context: GetServerSidePropsContext, saleId: string) {
  const response = await serverBackendRequest<{ ok: true; sale: SaleDetail }>(context, `/sales/${saleId}`);
  return response.sale;
}

export async function getSalePageDependenciesServer(context: GetServerSidePropsContext) {
  const [salesResponse, productsResponse, customers, usersResponse] = await Promise.all([
    getSalesDataServer(context),
    getProductsCatalogServer(context),
    getActiveCustomerOptionsServer(context),
    serverBackendRequest<{ ok: true; users: SellerOption[] }>(context, "/users"),
  ]);

  return {
    sales: salesResponse.sales,
    products: productsResponse.products,
    customers,
    sellers: usersResponse.users.filter((user) => user.isActive),
  };
}

export type SaleCustomerOption = CustomerListItem;
export type SaleProductOption = ProductListItem;

