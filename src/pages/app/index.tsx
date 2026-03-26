import type { GetServerSideProps } from "next";

import { withTenantPage } from "@/services/pages/guards";

export const getServerSideProps: GetServerSideProps = withTenantPage(async () => ({
  redirect: {
    destination: "/app/dashboard",
    permanent: false,
  },
}));

export default function TenantRootPage() {
  return null;
}

