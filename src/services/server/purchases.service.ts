import type { GetServerSidePropsContext } from "next";

import { PurchaseStatus } from "@prisma/client";

import { serverBackendRequest } from "@/services/backend/server-request";

export type SupplierListItem = {
  id: string;
  name: string;
  nit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  _count: {
    purchases: number;
  };
};

export type PurchaseListItem = {
  id: string;
  status: PurchaseStatus;
  total: number | string;
  orderedAt: string;
  expectedAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  supplierId: string | null;
  supplier: SupplierListItem | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitCost: number | string;
    subtotal: number | string;
  }>;
};

export type PurchaseDetail = Omit<PurchaseListItem, "items"> & {
  createdBy: {
    email: string;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitCost: number | string;
    subtotal: number | string;
    product: {
      id: string;
      name: string;
      sku: string | null;
    };
  }>;
};

export async function getPurchasesDataServer(context: GetServerSidePropsContext) {
  return serverBackendRequest<{
    ok: true;
    suppliers: SupplierListItem[];
    purchases: PurchaseListItem[];
  }>(context, "/purchases");
}

export async function getPurchaseDetailServer(context: GetServerSidePropsContext, purchaseId: string) {
  const response = await serverBackendRequest<{ ok: true; purchase: PurchaseDetail }>(context, `/purchases/${purchaseId}`);
  return response.purchase;
}

