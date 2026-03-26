import type { GetServerSideProps } from "next";

import SuperTenantsPage from "@/features/super/screens/super-tenants-page";
import { withSuperPage } from "@/services/pages/guards";
import { getSuperTenantsServer } from "@/services/server/super.service";

export const getServerSideProps: GetServerSideProps = withSuperPage(async (context) => {
  const tenants = await getSuperTenantsServer(context);

  return {
    props: {
      tenants,
    },
  };
});

export default SuperTenantsPage;

