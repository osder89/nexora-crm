import type { GetServerSideProps } from "next";

import PurchaseOrdersPage from "@/features/purchases/screens/purchase-orders-page";
import { withTenantPage } from "@/services/pages/guards";
import { getProductsCatalogServer } from "@/services/server/products.service";
import { getPurchasesDataServer } from "@/services/server/purchases.service";

const PAGE_SIZE = 10;

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context, user) => {
  const q = typeof context.query.q === "string" ? context.query.q.trim().toLowerCase() : "";
  const status =
    context.query.status === "ORDERED" || context.query.status === "RECEIVED" || context.query.status === "CANCELED"
      ? context.query.status
      : "all";
  const supplierId = typeof context.query.supplierId === "string" ? context.query.supplierId.trim() : "";
  const requestedPage = Number.parseInt(typeof context.query.page === "string" ? context.query.page : "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [{ suppliers, purchases: allPurchases }, productsResponse] = await Promise.all([getPurchasesDataServer(context), getProductsCatalogServer(context)]);
  const filteredPurchases = allPurchases.filter((purchase) => {
    const matchesStatus = status === "all" ? true : purchase.status === status;
    const matchesSupplier = supplierId ? purchase.supplierId === supplierId : true;
    const supplierName = purchase.supplier?.name.toLowerCase() ?? "";
    const matchesQuery = !q || purchase.id.toLowerCase().includes(q) || supplierName.includes(q);

    return matchesStatus && matchesSupplier && matchesQuery;
  });

  const totalPurchases = filteredPurchases.length;
  const totalPages = Math.max(1, Math.ceil(totalPurchases / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  return {
    props: {
      q,
      status,
      supplierId,
      page: currentPage,
      totalPurchases,
      purchases: filteredPurchases.slice(skip, skip + PAGE_SIZE),
      suppliers,
      products: productsResponse.products,
      userRole: user.role,
    },
  };
});

export default PurchaseOrdersPage;

