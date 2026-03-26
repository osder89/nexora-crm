import type { GetServerSideProps } from "next";

import { withTenantPage } from "@/services/pages/guards";

export const getServerSideProps: GetServerSideProps = withTenantPage(async () => ({
  redirect: {
    destination: "/app/purchases/orders",
    permanent: false,
  },
}));

export default function PurchasesRootPage() {
  return null;
}

