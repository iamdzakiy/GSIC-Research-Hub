"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";
import { daysLeft } from "@/lib/opportunity-status";

interface CallRow { id: string; title: string; competition: string; reason: string }
interface MyCall { applications: { status: string }[] }
interface MyApp { status: string; call: { title: string } }
interface Saved { id: string; slug: string; title: string; deadline: string }

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await apiFetch(url);
    const b = await r.json().catch(() => null);
    return r.ok && b?.ok !== false ? (b as T) : null;
  } catch { return null; }
}

/** The personal part of the dashboard: what changed for you since you last looked. */
export default function HomeHooks() {
  const [calls, setCalls] = useState<CallRow[] | null>(null);
  const [mine, setMine] = useState<{ calls: MyCall[]; applications: MyApp[] } | null>(null);
  const [saved, setSaved] = useState<Saved[] | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const [c, m, s] = await Promise.all([
        getJson<{ calls: CallRow[] }>("/api/teams/calls"),
        getJson<{ calls: MyCall[]; applications: MyApp[] }>("/api/teams/applications"),
        getJson<{ saved: Saved[] }>("/api/saved"),
      ]);
      if (!live) return;
      setCalls(c?.calls.slice(0, 3) ?? []);
      setMine(m ?? { calls: [], applications: [] });
      setSaved(s?.saved ?? []);
    })();
    return () => { live = false; };
  }, []);

  if (!calls || !mine || !saved) return <div className="grid gap-3 md:grid-cols-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-white" />)}</div>;

  const waiting = mine.calls.reduce((n, c) => n + c.applications.filter((a) => a.status === "pending").length, 0);
  const accepted = mine.applications.filter((a) => a.status === "accepted").length;
  const pendingMine = mine.applications.filter((a) => a.status === "pending").length;
  const soon = saved.filter((o) => daysLeft(new Date(o.deadline)) <= 14 && new Date(o.deadline) > new Date()).slice(0, 3);

  const card = "rounded-xl border border-slate-200 bg-white p-5";
  const h = "text-xs font-semibold uppercase tracking-wider text-slate-500";
  return (
    <section aria-label="For you" className="grid gap-3 md:grid-cols-3">
      <div className={card}>
        <h2 className={h}>Team calls for you</h2>
        {calls.length === 0 ? <p className="mt-3 text-sm text-slate-600">Nothing new matches your role yet.</p> : (
          <ul className="mt-3 space-y-2.5">
            {calls.map((c) => (
              <li key={c.id}><Link href="/teams" className="block text-sm font-semibold text-slate-900 hover:text-brand-700">{c.title}</Link><p className="text-xs text-slate-500">{c.reason || c.competition}</p></li>
            ))}
          </ul>
        )}
        <Link href="/teams" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">Open teams</Link>
      </div>

      <div className={card}>
        <h2 className={h}>Waiting on you</h2>
        {waiting + accepted + pendingMine === 0 ? <p className="mt-3 text-sm text-slate-600">No applications to review or follow.</p> : (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {waiting > 0 && <li><Link href="/teams?tab=mine" className="font-semibold text-brand-700 hover:underline">{waiting} {waiting === 1 ? "applicant" : "applicants"}</Link> waiting for your decision</li>}
            {accepted > 0 && <li><Link href="/teams?tab=applied" className="font-semibold text-brand-700 hover:underline">{accepted} accepted</Link>. Contact details are visible.</li>}
            {pendingMine > 0 && <li>{pendingMine} of your applications {pendingMine === 1 ? "is" : "are"} still pending</li>}
          </ul>
        )}
      </div>

      <div className={card}>
        <h2 className={h}>Saved, closing soon</h2>
        {soon.length === 0 ? <p className="mt-3 text-sm text-slate-600">{saved.length ? "None of your saved items close in the next two weeks." : "Save opportunities to track their deadlines here."}</p> : (
          <ul className="mt-3 space-y-2.5">
            {soon.map((o) => (
              <li key={o.id}><Link href={`/opportunities/${o.slug}`} className="block text-sm font-semibold text-slate-900 hover:text-brand-700">{o.title}</Link><p className="text-xs text-rose-700">{daysLeft(new Date(o.deadline)) <= 0 ? "Closes today" : `${daysLeft(new Date(o.deadline))} days left`}</p></li>
            ))}
          </ul>
        )}
        <Link href="/opportunities" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">Browse opportunities</Link>
      </div>
    </section>
  );
}
