import type { GetServerSideProps } from "next";

import ReceiptsPage from "@/features/purchases/screens/purchase-receipts-page";
import { withTenantPage } from "@/services/pages/guards";
import { getPurchasesDataServer } from "@/services/server/purchases.service";

const PAGE_SIZE = 12;

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context, user) => {
  const q = typeof context.query.q === "string" ? context.query.q.trim().toLowerCase() : "";
  const status = context.query.status === "ORDERED" || context.query.status === "RECEIVED" ? context.query.status : "all";
  const supplierId = typeof context.query.supplierId === "string" ? context.query.supplierId.trim() : "";
  const requestedPage = Number.parseInt(typeof context.query.page === "string" ? context.query.page : "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const { suppliers, purchases: allPurchases } = await getPurchasesDataServer(context);
  const basePurchases = allPurchases.filter((purchase) => purchase.status === "ORDERED" || purchase.status === "RECEIVED");
  const filteredPurchases = basePurchases.filter((purchase) => {
    const matchesStatus = status === "all" ? true : purchase.status === status;
    const matchesSupplier = supplierId ? purchase.supplierId === supplierId : true;
    const supplierName = purchase.supplier?.name.toLowerCase() ?? "";
    const matchesQuery = !q || purchase.id.toLowerCase().includes(q) || supplierName.includes(q);

    return matchesStatus && matchesSupplier && matchesQuery;
  });

  const totalReceipts = filteredPurchases.length;
  const totalPages = Math.max(1, Math.ceil(totalReceipts / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  return {
    props: {
      q,
      status,
      supplierId,
      page: currentPage,
      totalReceipts,
      purchases: filteredPurchases.slice(skip, skip + PAGE_SIZE),
      suppliers,
      orderedCount: allPurchases.filter((purchase) => purchase.status === "ORDERED").length,
      receivedCount: allPurchases.filter((purchase) => purchase.status === "RECEIVED").length,
      userRole: user.role,
    },
  };
});

export default ReceiptsPage;

