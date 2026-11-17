"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Copy, Monitor, Pencil, Plus, QrCode, Trash2, Copy as Dup } from "lucide-react";
import QRCode from "qrcode";
import type { GSICEvent, Test } from "@/lib/types";
import { apiFetch } from "@/lib/apiFetch";
import { deleteTest, duplicateTest } from "@/services/tests";
import { cn } from "@/lib/cn";

const TestBuilder = dynamic(() => import("@/components/tests/TestBuilder"), { ssr: false });
const field = "bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-600/60";
const KIND: Record<string, string> = { pre_test: "Pre-test", post_test: "Post-test", survey: "Survey" };

function status(t: Test): { label: string; tone: string } {
  const now = Date.now();
  if (!t.opensAt) return { label: "Closed", tone: "bg-white/10 text-white/60" };
  if (new Date(t.opensAt).getTime() > now) return { label: "Scheduled", tone: "bg-warning/20 text-warning" };
  if (t.closesAt && new Date(t.closesAt).getTime() < now) return { label: "Closed", tone: "bg-white/10 text-white/60" };
  return { label: "Open", tone: "bg-mint/20 text-mint" };
}
const local = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

function QrDialog({ url, onClose }: { url: string; onClose: () => void }) {
  const [svg, setSvg] = useState("");
  useEffect(() => { QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" }).then(setSvg).catch(() => undefined); }, [url]);
  const download = async () => { const png = await QRCode.toDataURL(url, { margin: 2, width: 1024 }); const a = document.createElement("a"); a.href = png; a.download = "qr.png"; a.click(); };
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="QR code" className="w-full max-w-xs rounded-2xl bg-white p-5 text-center text-ink">
        <div className="mx-auto w-56 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-3 break-all text-xs text-ink-3">{url}</p>
        <div className="mt-4 flex justify-center gap-2"><button type="button" onClick={download} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">Download PNG</button><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">Close</button></div>
      </div>
    </div>
  );
}

function Row({ t, onChange, onEdit }: { t: Test; onChange: () => void; onEdit: (t: Test) => void }) {
  const [counts, setCounts] = useState<{ inProgress: number; submitted: number } | null>(null);
  const [qr, setQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [opens, setOpens] = useState(local(t.opensAt));
  const [closes, setCloses] = useState(local(t.closesAt));
  const [err, setErr] = useState("");
  const st = status(t);
  const link = typeof window !== "undefined" && t.code ? `${window.location.origin}/a/${t.code}` : "";

  useEffect(() => {
    if (!t.code) return;
    let live = true;
    const pull = async () => { try { const r = await fetch(`/api/assessments/live?code=${t.code}`, { cache: "no-store" }); if (r.ok && live) setCounts(await r.json()); } catch { /* ignore */ } };
    void pull(); const i = setInterval(pull, 8000);
    return () => { live = false; clearInterval(i); };
  }, [t.code]);

  async function put(body: Record<string, unknown>) {
    setErr("");
    const res = await apiFetch("/api/tests", { method: "PUT", body: JSON.stringify({ id: t.id, ...body }) });
    if (!res.ok) { const b = await res.json().catch(() => null); setErr(b?.error ?? "Could not save."); return; }
    onChange();
  }
  const iso = (v: string) => (v ? new Date(v).toISOString() : null);

  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{t.title}</p>
          <p className="text-[11px] text-white/40">{KIND[t.kind ?? "pre_test"]}{t.episode ? ` · Episode ${t.episode}` : ""} · {(t.sections?.length ? t.sections.reduce((n, s) => n + s.questions.length, 0) : t.questions.length)} items{t.key ? ` · ${t.key}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded px-2 py-0.5 text-xs", st.tone)}>{st.label}</span>
          {counts && <span className="text-xs text-white/60" aria-label="Live count">{counts.submitted} submitted · {counts.inProgress} in progress</span>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2 text-[11px] text-white/50">
        <button type="button" onClick={() => put({ openNow: true })} className="rounded-lg bg-mint/20 px-2.5 py-1.5 text-xs font-semibold text-mint">Open now</button>
        <button type="button" onClick={() => put({ closeNow: true })} className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/80">Close now</button>
        <label className="flex flex-col gap-0.5">Opens<input type="datetime-local" value={opens} onChange={(e) => setOpens(e.target.value)} className={field} /></label>
        <label className="flex flex-col gap-0.5">Closes<input type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} className={field} /></label>
        <button type="button" onClick={() => put({ opensAt: iso(opens), closesAt: iso(closes) })} className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80">Save schedule</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {t.code && <>
          <code className="rounded bg-black/30 px-2 py-1 text-white/80">/a/{t.code}</code>
          <button type="button" onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="flex items-center gap-1 text-mint hover:underline"><Copy className="h-3.5 w-3.5" />{copied ? "Copied" : "Copy link"}</button>
          <button type="button" onClick={() => setQr(true)} className="flex items-center gap-1 text-mint hover:underline"><QrCode className="h-3.5 w-3.5" />QR</button>
          <a href={`/a/${t.code}/live`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-mint hover:underline"><Monitor className="h-3.5 w-3.5" />Projector view</a>
        </>}
        <span className="ml-auto flex items-center gap-3">
          <button type="button" onClick={() => onEdit(t)} className="flex items-center gap-1 text-white/70 hover:text-white"><Pencil className="h-3.5 w-3.5" />Edit</button>
          <button type="button" onClick={async () => { await duplicateTest(t.id); onChange(); }} className="flex items-center gap-1 text-white/70 hover:text-white"><Dup className="h-3.5 w-3.5" />Duplicate</button>
          <button type="button" aria-label={`Delete ${t.title}`} onClick={async () => { if (!confirm("Delete this test?")) return; try { await deleteTest(t.id); onChange(); } catch (e) { setErr(e instanceof Error ? e.message : "Could not delete."); } }} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
        </span>
      </div>
      {err && <p role="alert" className="mt-2 text-xs text-rose-300">{err}</p>}
      {qr && link && <QrDialog url={link} onClose={() => setQr(false)} />}
    </div>
  );
}

/** Tests and surveys: open or schedule them, hand out the short link and QR code, watch the live count. */
export default function AssessmentsPanel({ events, tests, reload }: { events: GSICEvent[]; tests: Test[]; reload: () => void | Promise<void> }) {
  const [builder, setBuilder] = useState<{ eventId: string; test: Test | null } | null>(null);
  const [eventId, setEventId] = useState("");
  const refresh = useCallback(() => void reload(), [reload]);
  const byEvent = events.map((e) => ({ e, list: tests.filter((t) => t.eventId === e.id) })).filter((g) => g.list.length);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-semibold font-heading">Tests and surveys ({tests.length})</h3>
        <select aria-label="Event" value={eventId} onChange={(e) => setEventId(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"><option value="">Select event…</option>{events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}</select>
        <button type="button" disabled={!eventId} onClick={() => setBuilder({ eventId, test: null })} className="flex items-center gap-1 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"><Plus className="h-4 w-4" />New</button>
      </div>
      {byEvent.length === 0 ? <p className="py-8 text-center text-white/40">No tests yet. Seed them with <code>npx tsx scripts/seed-assessments.ts</code>, or create one above.</p> : (
        <div className="space-y-6">
          {byEvent.map(({ e, list }) => (
            <section key={e.id} aria-label={e.title}>
              <h4 className="mb-2 text-sm font-semibold text-white/80">{e.title}</h4>
              <div className="space-y-2">{list.map((t) => <Row key={t.id} t={t} onChange={refresh} onEdit={(x) => setBuilder({ eventId: x.eventId, test: x })} />)}</div>
            </section>
          ))}
        </div>
      )}
      {builder && <TestBuilder eventId={builder.eventId} initial={builder.test} onClose={() => setBuilder(null)} onSaved={() => { setBuilder(null); refresh(); }} />}
    </div>
  );
}
