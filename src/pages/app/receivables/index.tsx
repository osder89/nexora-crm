import type { GetServerSideProps } from "next";

import ReceivablesPage from "@/features/receivables/screens/receivables-page";
import { withTenantPage } from "@/services/pages/guards";
import { getReceivablesDataServer } from "@/services/server/receivables.service";
import { getTenantUsersServer } from "@/services/server/users.service";

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context) => {
  const q = typeof context.query.q === "string" ? context.query.q.trim().toLowerCase() : "";
  const segment =
    context.query.segment === "overdue" || context.query.segment === "upcoming" || context.query.segment === "pending"
      ? context.query.segment
      : "all";
  const sellerId = typeof context.query.sellerId === "string" ? context.query.sellerId.trim() : "";
  const requestedPage = Number.parseInt(typeof context.query.page === "string" ? context.query.page : "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [receivablesResponse, users] = await Promise.all([getReceivablesDataServer(context), getTenantUsersServer(context)]);

  return {
    props: {
      q,
      segment,
      sellerId,
      page,
      sales: receivablesResponse.sales,
      users,
    },
  };
});

export default ReceivablesPage;

