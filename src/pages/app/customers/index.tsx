import type { GetServerSideProps } from "next";

import CustomersPage from "@/features/customers/screens/customers-page";
import { withTenantPage } from "@/services/pages/guards";
import { getCustomersPageServer } from "@/services/server/customers.service";

const PAGE_SIZE = 10;

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context, user) => {
  const q = typeof context.query.q === "string" ? context.query.q.trim() : "";
  const status =
    context.query.status === "inactive" ? "inactive" : context.query.status === "active" ? "active" : "all";
  const requestedPage = Number.parseInt(typeof context.query.page === "string" ? context.query.page : "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const response = await getCustomersPageServer(context, {
    q,
    status,
    page,
    take: PAGE_SIZE,
  });

  return {
    props: {
      q,
      status,
      page,
      totalCustomers: response.totalCustomers,
      customers: response.customers,
      userRole: user.role,
    },
  };
});

export default CustomersPage;

