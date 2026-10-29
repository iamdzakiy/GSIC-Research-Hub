"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { apiFetch } from "@/lib/apiFetch";

/** Number of applications waiting for the user's decision. Refreshes on load and every minute while the tab is visible. */
export function useTeamBadge(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    let live = true;
    const load = () => {
      if (document.visibilityState !== "visible") return;
      apiFetch("/api/teams/badge").then((r) => (r.ok ? r.json() : null)).then((b) => { if (live && typeof b?.count === "number") setCount(b.count); }).catch(() => undefined);
    };
    load();
    const t = setInterval(load, 60_000);
    return () => { live = false; clearInterval(t); };
  }, [user]);

  return count;
}
