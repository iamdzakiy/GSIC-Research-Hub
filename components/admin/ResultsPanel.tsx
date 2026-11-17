"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import type { GSICEvent } from "@/lib/types";
import type { PairStats, SurveyItemStat } from "@/lib/analytics";
import type { ParticipantRow } from "@/lib/results-data";
import { apiFetch } from "@/lib/apiFetch";
import PairBars from "@/components/charts/PairBars";
import { cn } from "@/lib/cn";

interface Data {
  options: { faculties: string[]; majors: string[]; years: number[] };
  tests: { id: string; key: string | null; title: string; kind: string; episode: number | null }[];
  pairs: PairStats[]; surveys: { title: string; n: number; items: SurveyItemStat[] }[]; participants: ParticipantRow[];
}
const sel = "rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white";
const card = "rounded-xl bg-white/5 p-4";

function Dist({ item }: { item: SurveyItemStat }) {
  const max = Math.max(1, ...(item.distribution ?? []).map((d) => d.count));
  return (
    <ul className="mt-2 space-y-1">
      {(item.distribution ?? []).map((d) => (
        <li key={d.label} className="flex items-center gap-2 text-xs"><span className="w-28 shrink-0 truncate text-white/60" title={d.label}>{d.label}</span>
          <span className="h-2 flex-1 rounded bg-white/10"><span className="block h-2 rounded bg-mint" style={{ width: `${(d.count / max) * 100}%` }} /></span><span className="w-6 text-right tabular-nums text-white/70">{d.count}</span></li>
      ))}
    </ul>
  );
}

function SurveyItem({ item }: { item: SurveyItemStat }) {
  const [q, setQ] = useState("");
  if (item.texts) {
    const list = item.texts.filter((t) => t.toLowerCase().includes(q.toLowerCase()));
    return (
      <div className={card}>
        <p lang="id" className="text-sm font-medium">{item.text}</p><p className="text-[11px] text-white/40">{item.n} answers</p>
        <label className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-xs"><Search className="h-3.5 w-3.5 text-white/40" aria-hidden="true" /><input aria-label={`Search answers to ${item.text}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search answers" className="w-full bg-transparent text-white focus:outline-none" /></label>
        <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto text-sm text-white/80">{list.map((t, i) => <li key={i} lang="id" className="rounded bg-white/5 px-2 py-1.5">{t}</li>)}{!list.length && <li className="text-white/40">No match.</li>}</ul>
      </div>
    );
  }
  return (
    <div className={card}>
      <p lang="id" className="text-sm font-medium">{item.text}</p>
      <p className="text-[11px] text-white/40">{item.n} answers{item.mean != null ? ` · mean ${item.mean}` : ""}</p>
      {item.nps && <p className="mt-2 text-sm">NPS <strong className="text-lg text-mint">{item.nps.score ?? "–"}</strong> <span className="text-xs text-white/60">· {item.nps.promoters} promoters, {item.nps.passives} passives, {item.nps.detractors} detractors</span></p>}
      <Dist item={item} />
    </div>
  );
}

export default function ResultsPanel({ events }: { events: GSICEvent[] }) {
  const [eventId, setEventId] = useState("");
  const [f, setF] = useState({ faculty: "", major: "", year: "" });
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [view, setView] = useState<"tests" | "surveys" | "people">("tests");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: keyof ParticipantRow; dir: 1 | -1 }>({ k: "name", dir: 1 });
  const [note, setNote] = useState("");
  const query = useMemo(() => new URLSearchParams({ eventId, ...(f.faculty && { faculty: f.faculty }), ...(f.major && { major: f.major }), ...(f.year && { year: f.year }) }).toString(), [eventId, f]);

  const load = useCallback(async () => {
    if (!eventId) { setData(null); return; }
    setErr("");
    const res = await apiFetch(`/api/admin/results?${query}`);
    const b = await res.json().catch(() => null);
    if (!res.ok) return setErr(b?.error ?? "Could not load results.");
    setData(b);
  }, [eventId, query]);
  useEffect(() => { void load(); }, [load]);

  async function csv() {
    const res = await apiFetch(`/api/admin/results/csv?${query}`);
    if (!res.ok) return setErr("Could not export.");
    const a = document.createElement("a"); a.href = URL.createObjectURL(await res.blob()); a.download = "gsic-results.csv"; a.click();
  }
  async function sync() {
    const res = await apiFetch("/api/admin/results/sync", { method: "POST", body: JSON.stringify({ eventId }) });
    const b = await res.json().catch(() => null);
    setNote(res.ok ? "Queued. The tabs update within a minute." : b?.error ?? "Could not queue the sync.");
  }

  const people = useMemo(() => {
    const rows = (data?.participants ?? []).filter((p) => `${p.nim ?? ""} ${p.name} ${p.major}`.toLowerCase().includes(q.toLowerCase()));
    return rows.sort((a, b) => { const x = a[sort.k] ?? "", y = b[sort.k] ?? ""; return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir; });
  }, [data, q, sort]);
  const th = (k: keyof ParticipantRow, label: string) => <th scope="col" aria-sort={sort.k === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className="px-2 py-1.5 text-left font-medium"><button type="button" onClick={() => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : 1 }))} className="hover:text-white">{label}{sort.k === k ? (sort.dir === 1 ? " ↑" : " ↓") : ""}</button></th>;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-semibold font-heading">Results</h3>
        <select aria-label="Event" value={eventId} onChange={(e) => setEventId(e.target.value)} className={sel}><option value="">Select event…</option>{events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select>
        <select aria-label="Faculty" value={f.faculty} onChange={(e) => setF({ ...f, faculty: e.target.value })} className={sel}><option value="">All faculties</option>{data?.options.faculties.map((x) => <option key={x}>{x}</option>)}</select>
        <select aria-label="Major" value={f.major} onChange={(e) => setF({ ...f, major: e.target.value })} className={sel}><option value="">All majors</option>{data?.options.majors.map((x) => <option key={x}>{x}</option>)}</select>
        <select aria-label="Intake year" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} className={sel}><option value="">All intakes</option>{data?.options.years.map((x) => <option key={x}>{x}</option>)}</select>
        <button type="button" onClick={csv} disabled={!eventId} className="flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 disabled:opacity-40"><Download className="h-3.5 w-3.5" />CSV with NIM</button>
        <button type="button" onClick={sync} disabled={!eventId} className="flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 disabled:opacity-40"><RefreshCw className="h-3.5 w-3.5" />Sync to sheet</button>
      </div>
      {note && <p role="status" className="mb-3 text-xs text-mint">{note}</p>}
      {err && <p role="alert" className="mb-3 text-xs text-rose-300">{err}</p>}
      {!eventId ? <p className="py-8 text-center text-white/40">Pick an event to see its results.</p> : !data ? <p className="py-8 text-center text-white/40">Loading…</p> : (
        <>
          <div role="tablist" aria-label="Results view" className="mb-4 flex gap-1 border-b border-white/10">
            {([["tests", "Tests"], ["surveys", "Surveys"], ["people", `Participants (${data.participants.length})`]] as const).map(([id, l]) => <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)} className={cn("-mb-px border-b-2 px-3 py-2 text-sm", view === id ? "border-mint text-mint" : "border-transparent text-white/50 hover:text-white")}>{l}</button>)}
          </div>

          {view === "tests" && (data.pairs.length === 0 ? <p className="py-6 text-center text-white/40">No tests for this event.</p> : (
            <div className="space-y-6">
              {data.pairs.map((p) => (
                <section key={p.pairKey} aria-label={p.title} className="space-y-3">
                  <h4 lang="id" className="font-semibold">{p.title}</h4>
                  <div className="grid gap-3 sm:grid-cols-4 text-sm">
                    {[["Pre taken", p.pre.n], ["Post taken", p.post.n], ["Pre mean / median", `${p.pre.mean ?? "–"} / ${p.pre.median ?? "–"}`], ["Post mean / median", `${p.post.mean ?? "–"} / ${p.post.median ?? "–"}`]].map(([l, v]) => <div key={l as string} className={card}><p className="text-[11px] text-white/40">{l}</p><p className="font-display text-xl font-bold">{v}</p></div>)}
                  </div>
                  <p className="text-sm text-white/70">Both taken: <strong>{p.both}</strong> · Mean normalised gain: <strong>{p.meanGain ?? "–"}</strong></p>
                  <div className="rounded-xl bg-white p-4 text-ink"><PairBars caption="Score distribution (number of people per 10-point band)" data={p.pre.bins.map((c, i) => ({ label: i === 9 ? "90+" : `${i * 10}`, a: c, b: p.post.bins[i] }))} max={Math.max(1, ...p.pre.bins, ...p.post.bins)} /></div>
                  <div className="overflow-x-auto"><table className="w-full text-xs">
                    <caption className="sr-only">Per-question results for {p.title}</caption>
                    <thead className="text-left text-white/50"><tr><th className="px-2 py-1.5 font-medium">Question</th><th className="px-2 py-1.5 font-medium">Pre correct</th><th className="px-2 py-1.5 font-medium">Post correct</th><th className="px-2 py-1.5 font-medium">Most chosen wrong option</th><th className="px-2 py-1.5 font-medium">Flag</th></tr></thead>
                    <tbody>{p.questions.map((x) => <tr key={x.id} className="border-t border-white/10 align-top"><td lang="id" className="max-w-xs px-2 py-1.5">{x.text}</td><td className="px-2 py-1.5">{x.preCorrect ?? "–"}{x.preCorrect != null ? "%" : ""}</td><td className="px-2 py-1.5">{x.postCorrect ?? "–"}{x.postCorrect != null ? "%" : ""}</td><td lang="id" className="px-2 py-1.5">{x.topWrong ? `${x.topWrong.option} (${x.topWrong.count})` : "–"}</td><td className="px-2 py-1.5">{x.flag === "too_hard" ? <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-200">Under 20% correct</span> : x.flag === "too_easy" ? <span className="rounded bg-warning/20 px-1.5 py-0.5 text-warning">Over 95% correct</span> : ""}</td></tr>)}</tbody>
                  </table></div>
                </section>
              ))}
            </div>
          ))}

          {view === "surveys" && (data.surveys.length === 0 ? <p className="py-6 text-center text-white/40">No surveys for this event.</p> : (
            <div className="space-y-6">{data.surveys.map((s) => <section key={s.title} aria-label={s.title}><h4 lang="id" className="mb-2 font-semibold">{s.title} <span className="text-xs font-normal text-white/40">· {s.n} responses</span></h4><div className="grid gap-3 md:grid-cols-2">{s.items.map((it) => <SurveyItem key={it.id} item={it} />)}</div></section>)}</div>
          ))}

          {view === "people" && (
            <div>
              <label className="mb-3 flex max-w-xs items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-sm"><Search className="h-4 w-4 text-white/40" aria-hidden="true" /><input aria-label="Search participants" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, NIM, major" className="w-full bg-transparent text-white focus:outline-none" /></label>
              <div className="overflow-x-auto"><table className="w-full text-xs">
                <thead className="text-white/50"><tr>{th("nim", "NIM")}{th("name", "Name")}{th("major", "Program")}{th("year", "Intake")}{th("pre", "Pre")}{th("post", "Post")}{th("surveys", "Survey")}{th("status", "Status")}</tr></thead>
                <tbody>{people.map((p) => <tr key={p.userId} className="border-t border-white/10"><td className="px-2 py-1.5 font-mono">{p.nim ?? "–"}</td><td className="px-2 py-1.5">{p.name}</td><td className="px-2 py-1.5">{p.major}</td><td className="px-2 py-1.5">{p.year ?? ""}</td><td className="px-2 py-1.5">{p.pre ?? "–"}</td><td className="px-2 py-1.5">{p.post ?? "–"}</td><td className="px-2 py-1.5">{p.surveys}</td><td className="px-2 py-1.5">{p.status.replace("_", " ")}</td></tr>)}</tbody>
              </table></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
