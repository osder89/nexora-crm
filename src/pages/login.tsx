import type { GetServerSideProps } from "next";

import LoginPage from "@/features/auth/screens/login-page";
import { getPageSessionUser } from "@/services/auth/session.server";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const reason = typeof context.query.reason === "string" ? context.query.reason : null;
  const user = await getPageSessionUser(context);

  if (!user || reason === "expired" || reason === "idle") {
    return {
      props: {},
    };
  }

  return {
    redirect: {
      destination: user.role === "SUPER_ADMIN" ? "/super/tenants" : "/app/dashboard",
      permanent: false,
    },
  };
};

export default LoginPage;
