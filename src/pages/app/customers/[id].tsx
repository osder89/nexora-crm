import type { GetServerSideProps } from "next";

import CustomerDetailPage from "@/features/customers/screens/customer-detail-page";
import { withTenantPage } from "@/services/pages/guards";
import { getCustomerDetailServer } from "@/services/server/customers.service";

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context) => {
  const id = typeof context.params?.id === "string" ? context.params.id : "";

  if (!id) {
    return { notFound: true };
  }

  const customer = await getCustomerDetailServer(context, id).catch(() => null);

  if (!customer || customer.deletedAt) {
    return { notFound: true };
  }

  return {
    props: {
      customer,
    },
  };
});

export default CustomerDetailPage;

