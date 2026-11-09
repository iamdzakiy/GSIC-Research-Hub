"use client";
// Admin: email and sheet queue health, competitions waiting for review, reported partner posts.
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

interface Status { pending: number; failed: number; last: { kind: string; lastError: string | null; failedAt: string } | null; lastSheetSyncAt: string | null }
interface Sub { id: string; slug: string; title: string; organizer: string; deadline: string; link: string | null; category: string | null }
interface Rep { id: string; title: string; competition: string; hiddenAt: string | null; owner: { name: string | null; email: string }; reports: { reason: string | null }[] }

const j = async <T,>(url: string, init?: Omit<RequestInit, "headers">) => { const r = await apiFetch(url, { headers: { "Content-Type": "application/json" }, ...init }); return (await r.json().catch(() => null)) as T; };
const when = (s: string | null) => (s ? new Date(s).toLocaleString("en-GB", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }) + " WIB" : "never");

export default function HubOpsPanel({ onEdit }: { onEdit?: (id: string) => void }) {
  const [st, setSt] = useState<Status | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      j<Status & { ok: boolean }>("/api/admin/outbox"),
      j<{ opportunities?: Sub[] }>("/api/opportunities?type=competition&unpublished=only&pageSize=50"),
      j<{ calls?: Rep[] }>("/api/admin/reports"),
    ]);
    if (a?.ok) setSt(a);
    setSubs(b?.opportunities ?? []);
    setReps(c?.calls ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const btn = "h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50";
  return (
    <div className="space-y-6">
      {msg && <p role="status" className="rounded-lg bg-mint-50 px-3 py-2 text-sm text-mint-900">{msg}</p>}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Email and sheet queue</h3>
        {!st ? <p className="mt-2 text-sm text-slate-500">Loading…</p> : (
          <>
            <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div><dt className="text-slate-500">Waiting</dt><dd className="text-xl font-semibold tabular-nums">{st.pending}</dd></div>
              <div><dt className="text-slate-500">Failed</dt><dd className={`text-xl font-semibold tabular-nums ${st.failed ? "text-rose-700" : ""}`}>{st.failed}</dd></div>
              <div><dt className="text-slate-500">Sheet reconciled</dt><dd className="font-medium">{when(st.lastSheetSyncAt)}</dd></div>
            </dl>
            {st.last && <p className="mt-3 rounded-md bg-rose-50 p-2.5 font-mono text-xs text-rose-800">{st.last.kind}: {st.last.lastError}</p>}
            {st.failed > 0 && <button type="button" className={`${btn} mt-3`} onClick={async () => { const r = await j<{ retried: number }>("/api/admin/outbox", { method: "POST" }); setMsg(`Retrying ${r?.retried ?? 0} jobs.`); void load(); }}>Retry failed</button>}
          </>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Submitted competitions <span className="tabular-nums text-slate-500">{subs.length}</span></h3>
        {subs.length === 0 ? <p className="mt-2 text-sm text-slate-500">Nothing to review.</p> : (
          <ul className="mt-3 divide-y divide-slate-100">
            {subs.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0"><p className="font-medium text-slate-900">{s.title}</p><p className="text-xs text-slate-500">{s.organizer} · closes {when(s.deadline)} {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" className="ml-1 underline">link</a>}</p></div>
                <div className="flex gap-2">
                  {onEdit && <button type="button" className={btn} onClick={() => onEdit(s.id)}>Edit</button>}
                  <button type="button" className={btn} onClick={async () => { await j("/api/opportunities", { method: "PUT", body: JSON.stringify({ id: s.id, isPublished: true }) }); setMsg(`Published ${s.title}.`); void load(); }}>Publish</button>
                  <button type="button" className={btn} onClick={async () => { if (!confirm(`Delete "${s.title}"?`)) return; await j("/api/opportunities", { method: "DELETE", body: JSON.stringify({ id: s.id }) }); void load(); }}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Reported partner posts</h3>
        {reps.length === 0 ? <p className="mt-2 text-sm text-slate-500">No reports.</p> : (
          <ul className="mt-3 divide-y divide-slate-100">
            {reps.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0"><p className="font-medium text-slate-900"><a href={`/partners/${r.id}`} className="hover:underline">{r.title}</a> {r.hiddenAt && <span className="ml-1 rounded bg-rose-100 px-1.5 text-xs text-rose-800">hidden</span>}</p><p className="text-xs text-slate-500">{r.owner.name} · {r.owner.email} · {r.reports.length} reports</p></div>
                  <div className="flex gap-2">
                    {r.hiddenAt ? <button type="button" className={btn} onClick={async () => { await j("/api/admin/reports", { method: "POST", body: JSON.stringify({ id: r.id, action: "restore" }) }); void load(); }}>Restore</button>
                      : <button type="button" className={btn} onClick={async () => { await j("/api/admin/reports", { method: "POST", body: JSON.stringify({ id: r.id, action: "hide" }) }); void load(); }}>Hide</button>}
                  </div>
                </div>
                {r.reports.some((x) => x.reason) && <ul className="mt-1.5 list-disc pl-5 text-xs text-slate-600">{r.reports.filter((x) => x.reason).map((x, i) => <li key={i}>{x.reason}</li>)}</ul>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
