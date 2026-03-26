import type { GetServerSideProps } from "next";

import SaleDetailPage from "@/features/sales/screens/sale-detail-page";
import { withTenantPage } from "@/services/pages/guards";
import { getSaleDetailServer } from "@/services/server/sales.service";

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context) => {
  const id = typeof context.params?.id === "string" ? context.params.id : "";

  if (!id) {
    return { notFound: true };
  }

  const sale = await getSaleDetailServer(context, id).catch(() => null);

  if (!sale) {
    return { notFound: true };
  }

  return {
    props: {
      sale,
    },
  };
});

export default SaleDetailPage;

