import type { GetServerSideProps } from "next";

import { getPageSessionUser, redirectToLogin } from "@/services/auth/session.server";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getPageSessionUser(context);

  if (!user) {
    return { redirect: redirectToLogin() };
  }

  if (user.role === "SUPER_ADMIN") {
    return {
      redirect: {
        destination: "/super/tenants",
        permanent: false,
      },
    };
  }

  if (user.tenantId) {
    return {
      redirect: {
        destination: "/app/dashboard",
        permanent: false,
      },
    };
  }

  return { redirect: redirectToLogin() };
};

export default function HomePage() {
  return null;
}

