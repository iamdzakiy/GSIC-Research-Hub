"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Mutates the current URL query string (the single source of truth for
 * filters). Resets `page` on every change. `replace` avoids polluting history
 * for high-frequency updates such as typing in the search box.
 */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const update = useCallback(
    (mutate: (p: URLSearchParams) => void, mode: "push" | "replace" = "push") => {
      const next = new URLSearchParams(sp.toString());
      mutate(next);
      next.delete("page");
      const qs = next.toString();
      start(() => {
        const url = qs ? `${pathname}?${qs}` : pathname;
        if (mode === "replace") router.replace(url, { scroll: false });
        else router.push(url, { scroll: false });
      });
    },
    [sp, pathname, router]
  );

  return { update, pending, searchParams: sp, pathname };
}
