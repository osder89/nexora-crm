"use client";

import { useRouter } from "next/router";

export function useCurrentPath() {
  const router = useRouter();
  return router.asPath.split("?")[0] || router.pathname;
}

