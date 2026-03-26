import type { GetServerSidePropsContext } from "next";

import { InstallmentStatus, SaleStatus, SaleType } from "@prisma/client";

import { serverBackendRequest } from "@/services/backend/server-request";

export type ReceivableSale = {
  id: string;
  saleType: SaleType;
  status: SaleStatus;
  balance: number | string;
  dueDate: string | null;
  customer: {
    id?: string;
    name: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    nit?: string | null;
  } | null;
  seller: {
    id: string;
    email: string;
  } | null;
  installments: Array<{
    id: string;
    installmentNumber: number;
    amount: number | string;
    paidAmount: number | string;
    dueDate: string;
    status: InstallmentStatus;
  }>;
  collectionLogs: Array<{
    id: string;
    comment: string;
    createdAt: string;
  }>;
};

export async function getReceivablesDataServer(context: GetServerSidePropsContext) {
  return serverBackendRequest<{ ok: true; sales: ReceivableSale[] }>(context, "/receivables");
}

