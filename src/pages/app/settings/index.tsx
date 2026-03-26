import type { GetServerSideProps } from "next";

import { Role } from "@prisma/client";

import SettingsPage from "@/features/settings/screens/settings-page";
import { withTenantPage } from "@/services/pages/guards";
import { getTenantSettingsServer } from "@/services/server/settings.service";

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context, user) => {
  const tenant = await getTenantSettingsServer(context, user);

  return {
    props: {
      tenant,
    },
  };
}, [Role.ADMIN_EMPRESA]);

export default SettingsPage;

