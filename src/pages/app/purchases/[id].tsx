import type { GetServerSideProps } from "next";

import PurchaseDetailPage from "@/features/purchases/screens/purchase-detail-page";
import { withTenantPage } from "@/services/pages/guards";
import { getPurchaseDetailServer } from "@/services/server/purchases.service";

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context, user) => {
  const id = typeof context.params?.id === "string" ? context.params.id : "";

  if (!id) {
    return { notFound: true };
  }

  const purchase = await getPurchaseDetailServer(context, id).catch(() => null);

  if (!purchase) {
    return { notFound: true };
  }

  return {
    props: {
      purchase,
      userRole: user.role,
    },
  };
});

export default PurchaseDetailPage;

