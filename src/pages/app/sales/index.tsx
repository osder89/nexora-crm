import type { GetServerSideProps } from "next";

import SalesPage from "@/features/sales/screens/sales-page";
import { withTenantPage } from "@/services/pages/guards";
import { getSalePageDependenciesServer } from "@/services/server/sales.service";

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context) => {
  const q = typeof context.query.q === "string" ? context.query.q.trim().toLowerCase() : "";
  const status =
    context.query.status === "PAID" || context.query.status === "PENDING" || context.query.status === "OVERDUE" || context.query.status === "CANCELED"
      ? context.query.status
      : "all";
  const saleType = context.query.saleType === "CONTADO" || context.query.saleType === "CREDITO" ? context.query.saleType : "all";
  const sellerId = typeof context.query.sellerId === "string" ? context.query.sellerId.trim() : "";
  const requestedPage = Number.parseInt(typeof context.query.page === "string" ? context.query.page : "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const dependencies = await getSalePageDependenciesServer(context);

  return {
    props: {
      q,
      status,
      saleType,
      sellerId,
      page,
      ...dependencies,
    },
  };
});

export default SalesPage;

