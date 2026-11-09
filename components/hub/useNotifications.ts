"use client";
// One poller for the bell and the mobile badge. Refreshes on load, on focus and every minute while visible.
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { apiFetch } from "@/lib/apiFetch";

export interface Note { id: string; kind: string; title: string; body: string; url: string; readAt: string | null; createdAt: string }
type State = { unread: number; items: Note[] };
let shared: State = { unread: 0, items: [] };
const subs = new Set<(s: State) => void>();
let timer: ReturnType<typeof setInterval> | null = null;

async function refresh() {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
  const b = await apiFetch("/api/notifications").then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (b?.ok) { shared = { unread: b.unread, items: b.items }; subs.forEach((f) => f(shared)); }
}

export function useNotifications() {
  const { user } = useAuth();
  const [s, setS] = useState<State>(shared);
  useEffect(() => {
    if (!user) { setS({ unread: 0, items: [] }); return; }
    subs.add(setS);
    if (subs.size === 1) {
      void refresh();
      timer = setInterval(refresh, 60_000);
      window.addEventListener("focus", refresh);
    }
    return () => {
      subs.delete(setS);
      if (!subs.size) { if (timer) clearInterval(timer); timer = null; window.removeEventListener("focus", refresh); }
    };
  }, [user]);
  const markRead = useCallback(async () => {
    if (!shared.unread) return;
    shared = { unread: 0, items: shared.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) };
    subs.forEach((f) => f(shared));
    await apiFetch("/api/notifications", { method: "POST" }).catch(() => undefined);
  }, []);
  return { ...s, markRead, refresh };
}
