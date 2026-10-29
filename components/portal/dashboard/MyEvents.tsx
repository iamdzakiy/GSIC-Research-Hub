"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";
import { eventHref, eventWhen } from "@/lib/event-links";

interface Reg {
  id: string; preTestCompleted: boolean; details: { needsTeam?: boolean } | null;
  event: { slug: string | null; type: string; title: string; startDate: string; endDate: string; dateLabel: string | null; mode: string; meetingUrl: string | null; hasPreTest: boolean };
}

function countdown(startIso: string, endIso: string, now = Date.now()): string {
  const ms = new Date(startIso).getTime() - now;
  if (ms <= 0) return now < new Date(endIso).getTime() ? "Happening now" : "Finished";
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
  return d > 0 ? `In ${d} day${d === 1 ? "" : "s"}${h ? `, ${h} h` : ""}` : `In ${h || 1} h`;
}

/** Registered events with a countdown and the one thing to do next (pre-test, team, Zoom link). */
export default function MyEvents() {
  const [rows, setRows] = useState<Reg[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    apiFetch("/api/registrations/mine")
      .then(async (r) => { const b = await r.json().catch(() => null); if (!live) return; if (r.ok && b?.ok) setRows(b.registrations); else { setRows([]); setFailed(true); } })
      .catch(() => { if (live) { setRows([]); setFailed(true); } });
    return () => { live = false; };
  }, []);

  if (rows === null) return <div className="h-24 animate-pulse rounded-xl bg-white" aria-busy="true" />;
  if (failed) return <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">Your registered events could not be loaded.</p>;
  if (!rows.length) return null;

  return (
    <section aria-labelledby="my-events" className="space-y-3">
      <h2 id="my-events" className="font-display text-lg font-bold text-slate-900">Your events</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => {
          const e = r.event;
          const soon = new Date(e.startDate).getTime() - Date.now() < 864e5 && new Date(e.endDate).getTime() > Date.now();
          const action =
            e.meetingUrl && !e.dateLabel && soon ? { label: "Open the Zoom link", href: e.meetingUrl, external: true } :
            e.hasPreTest && !r.preTestCompleted ? { label: "Take the pre-test", href: eventHref(e), external: false } :
            r.details?.needsTeam ? { label: "Find teammates", href: `/teams?event=${e.slug ?? ""}&tab=open`, external: false } :
            { label: "View details", href: eventHref(e), external: false };
          return (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">{e.title}</p>
              <p className="mt-1 text-xs text-slate-500">{eventWhen(e)}</p>
              <p className="mt-3 font-display text-lg font-bold text-brand-700">{e.dateLabel ? "Date to be announced" : countdown(e.startDate, e.endDate)}</p>
              <Link href={action.href} {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">{action.label}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
