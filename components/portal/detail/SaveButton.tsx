"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/cn";

/** Bookmarks an opportunity. Saved items closing soon show up on the dashboard. */
export default function SaveButton({ opportunityId, next }: { opportunityId: string; next: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let live = true;
    apiFetch("/api/saved").then((r) => (r.ok ? r.json() : null)).then((b) => { if (live && b?.saved) setSaved(b.saved.some((o: { id: string }) => o.id === opportunityId)); }).catch(() => undefined);
    return () => { live = false; };
  }, [user, opportunityId]);

  async function toggle() {
    if (!user) return router.push(`/auth?mode=signin&next=${encodeURIComponent(next)}`);
    setBusy(true);
    const want = !saved;
    setSaved(want);
    try {
      const res = await apiFetch("/api/saved", { method: want ? "POST" : "DELETE", body: JSON.stringify({ opportunityId }) });
      if (!res.ok) throw new Error();
    } catch {
      setSaved(!want);
      toast("error", "Could not update your saved list.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={busy || loading} aria-pressed={saved}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 transition-colors hover:border-brand-400 hover:text-brand-700 disabled:opacity-60">
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} aria-hidden="true" /> {saved ? "Saved" : "Save for later"}
    </button>
  );
}
