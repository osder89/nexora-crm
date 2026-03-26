import type { GetServerSidePropsContext } from "next";

import { serverBackendRequest } from "@/services/backend/server-request";

export type ProductCategory = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type ProductListItem = {
  id: string;
  name: string;
  sku: string | null;
  categoryId: string | null;
  cost: number | string | null;
  price: number | string;
  stock: number;
  stockMin: number;
  isActive: boolean;
  createdAt: string;
  category: ProductCategory | null;
};

export async function getProductsCatalogServer(context: GetServerSidePropsContext) {
  return serverBackendRequest<{
    ok: true;
    products: ProductListItem[];
    categories: ProductCategory[];
  }>(context, "/products");
}

