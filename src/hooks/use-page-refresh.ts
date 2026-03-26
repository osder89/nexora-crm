"use client";

import { useRouter } from "next/router";

export function usePageRefresh() {
  const router = useRouter();

  return function refresh() {
    void router.replace(router.asPath, undefined, { scroll: false });
  };
}

