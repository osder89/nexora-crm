import type { GetServerSideProps } from "next";

import { withSuperPage } from "@/services/pages/guards";

export const getServerSideProps: GetServerSideProps = withSuperPage(async () => ({
  redirect: {
    destination: "/super/tenants",
    permanent: false,
  },
}));

export default function SuperRootPage() {
  return null;
}

