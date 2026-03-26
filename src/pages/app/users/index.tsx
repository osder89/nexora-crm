import type { GetServerSideProps } from "next";

import { Role } from "@prisma/client";

import UsersPage from "@/features/users/screens/users-page";
import { withTenantPage } from "@/services/pages/guards";
import { getTenantUsersServer } from "@/services/server/users.service";

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context) => {
  const users = await getTenantUsersServer(context);

  return {
    props: {
      users,
    },
  };
}, [Role.ADMIN_EMPRESA]);

export default UsersPage;

