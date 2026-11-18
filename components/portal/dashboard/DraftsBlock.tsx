"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { draftStorageKey, savedAgo } from "@/lib/form-draft";
import type { DraftRow } from "@/lib/validation/drafts";

interface Item { formKey: string; step: number; updatedAt: string }

function describe(d: Item, titles: Record<string, string>): { label: string; href: string; steps?: number } {
  if (d.formKey.startsWith("event:")) {
    const slug = d.formKey.slice(6);
    return { label: `${titles[slug] ?? "Event"} registration`, href: `/events/${slug}`, steps: 3 };
  }
  if (d.formKey === "partner-post") return { label: "Seeking Partner post", href: "/partners/new" };
  if (d.formKey === "competition-submit") return { label: "Competition submission", href: "/competitions/submit" };
  if (d.formKey === "profile") return { label: "Profile changes", href: "/settings" };
  return { label: "Unsent form", href: "/dashboard" };
}

/** Unsent forms. Continue opens the form where it was, Discard removes the draft. */
export default function DraftsBlock() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/drafts");
      const b = (await res.json().catch(() => null)) as { drafts?: Pick<DraftRow, "formKey" | "step" | "updatedAt">[] } | null;
      setItems(res.ok ? b?.drafts ?? [] : []);
    } catch { setItems([]); }
  }, []);

  useEffect(() => { if (user) void load(); }, [user, load]);
  useEffect(() => {
    if (!items?.some((i) => i.formKey.startsWith("event:"))) return;
    fetch("/api/events").then((r) => (r.ok ? r.json() : null)).then((b) => {
      const list = (Array.isArray(b) ? b : b?.events ?? []) as { slug?: string; title: string }[];
      setTitles(Object.fromEntries(list.filter((e) => e.slug).map((e) => [e.slug as string, e.title])));
    }).catch(() => undefined);
  }, [items]);

  async function discard(d: Item) {
    setItems((list) => list?.filter((x) => x.formKey !== d.formKey) ?? null);
    try { if (user) window.localStorage.removeItem(draftStorageKey(user.id, d.formKey)); } catch { /* ignore */ }
    try { await apiFetch(`/api/drafts/${encodeURIComponent(d.formKey)}`, { method: "DELETE" }); } catch { void load(); }
  }

  if (!items?.length) return null;
  return (
    <section aria-labelledby="drafts-h" className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 id="drafts-h" className="font-display text-base font-bold text-slate-900">Drafts</h2>
      <ul className="mt-2 divide-y divide-slate-100">
        {items.map((d) => {
          const info = describe(d, titles);
          return (
            <li key={d.formKey} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <p className="text-sm text-slate-800">
                <span className="font-medium">{info.label}</span>
                <span className="text-slate-500"> · {info.steps ? `step ${Math.min(d.step, info.steps)} of ${info.steps} · ` : ""}{savedAgo(Date.parse(d.updatedAt))}</span>
              </p>
              <span className="flex items-center gap-3 text-sm">
                <Link href={info.href} className="font-medium text-brand-700 hover:underline">Continue<span className="sr-only"> {info.label}</span></Link>
                <button type="button" onClick={() => discard(d)} className="font-medium text-slate-500 hover:text-rose-700">Discard<span className="sr-only"> {info.label}</span></button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
