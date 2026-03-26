import type { GetServerSideProps } from "next";

import DashboardPage from "@/features/dashboard/screens/dashboard-page";
import { withTenantPage } from "@/services/pages/guards";
import { getDashboardDataServer } from "@/services/server/dashboard.service";

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context) => {
  const from = typeof context.query.from === "string" ? context.query.from : "";
  const to = typeof context.query.to === "string" ? context.query.to : "";
  const sellerId = typeof context.query.sellerId === "string" ? context.query.sellerId.trim() : "";
  const dashboard = await getDashboardDataServer(context, { from, to, sellerId });

  return {
    props: {
      from,
      to,
      sellerId,
      ...dashboard,
    },
  };
});

export default DashboardPage;

