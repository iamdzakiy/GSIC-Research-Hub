"use client";
// URL-driven filters for /competitions (shareable, survive reloads).
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { COMPETITION_CATEGORIES } from "@/lib/competitions";
import { LEVELS } from "@/lib/opportunity-status";
import { chip } from "@/components/hub/buttons";
import { cn } from "@/lib/cn";

export default function CompetitionFilters({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [more, setMore] = useState(!!(sp.getAll("level").length || sp.getAll("mode").length));

  const push = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mut(p);
    start(() => router.replace(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false }));
  };
  const toggleMany = (k: string, v: string) => push((p) => { const cur = p.getAll(k); p.delete(k); (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).forEach((x) => p.append(k, x)); });
  const setOne = (k: string, v: string, def: string) => push((p) => (v === def ? p.delete(k) : p.set(k, v)));

  useEffect(() => {
    const t = setTimeout(() => { if ((sp.get("q") ?? "") !== q) setOne("q", q.trim(), ""); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const cats = sp.getAll("cat");
  const within = sp.get("within") ?? "any";
  const team = sp.get("team") ?? "any";
  const active = cats.length + (within !== "any" ? 1 : 0) + (team !== "any" ? 1 : 0) + (sp.get("free") ? 1 : 0) + sp.getAll("level").length + sp.getAll("mode").length + (sp.get("q") ? 1 : 0);

  return (
    <div className={cn("space-y-4 transition-opacity", pending && "opacity-70")} aria-busy={pending}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search competitions</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, organizer or theme" className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />
        </label>
        <div role="group" aria-label="Closes within" className="inline-flex h-11 shrink-0 rounded-lg border border-slate-300 bg-white p-1 text-sm">
          {[["7", "7 days"], ["30", "30 days"], ["any", "Any time"]].map(([v, l]) => (
            <button key={v} type="button" aria-pressed={within === v} onClick={() => setOne("within", v!, "any")} className={cn("rounded-md px-3 font-medium", within === v ? "bg-navy text-white" : "text-ink-2 hover:bg-paper-2")}>{l}</button>
          ))}
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Category">
        {COMPETITION_CATEGORIES.filter((c) => counts[c.id] || cats.includes(c.id)).map((c) => (
          <button key={c.id} type="button" aria-pressed={cats.includes(c.id)} onClick={() => toggleMany("cat", c.id)} className={cn(chip(cats.includes(c.id)), "shrink-0")} title={c.label}>
            {c.short}<span className={cn("tnum text-[11px]", cats.includes(c.id) ? "text-white/80" : "text-ink-3")}>{counts[c.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={team === "team"} onClick={() => setOne("team", team === "team" ? "any" : "team", "any")} className={chip(team === "team")}>Team</button>
        <button type="button" aria-pressed={team === "solo"} onClick={() => setOne("team", team === "solo" ? "any" : "solo", "any")} className={chip(team === "solo")}>Individual</button>
        <button type="button" aria-pressed={!!sp.get("free")} onClick={() => setOne("free", sp.get("free") ? "" : "1", "")} className={chip(!!sp.get("free"))}>Free to enter</button>
        <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className={chip(false)}><SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> Level and format</button>
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-ink-2"><input type="checkbox" checked={!!sp.get("closed")} onChange={(e) => setOne("closed", e.target.checked ? "1" : "", "")} className="h-4 w-4 accent-[#3352CD]" /> Show closed</label>
        {active > 0 && <button type="button" onClick={() => { setQ(""); start(() => router.replace(pathname, { scroll: false })); }} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"><X className="h-3.5 w-3.5" aria-hidden="true" /> Clear {active}</button>}
      </div>

      {more && (
        <div className="rise flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div role="group" aria-label="Level" className="flex flex-wrap items-center gap-2"><span className="label-mono text-ink-3">Level</span>{LEVELS.map((l) => <button key={l} type="button" aria-pressed={sp.getAll("level").includes(l)} onClick={() => toggleMany("level", l)} className={chip(sp.getAll("level").includes(l))}>{l}</button>)}</div>
          <div role="group" aria-label="Format" className="flex flex-wrap items-center gap-2"><span className="label-mono text-ink-3">Format</span>{["online", "onsite", "hybrid"].map((m) => <button key={m} type="button" aria-pressed={sp.getAll("mode").includes(m)} onClick={() => toggleMany("mode", m)} className={cn(chip(sp.getAll("mode").includes(m)), "capitalize")}>{m}</button>)}</div>
        </div>
      )}
    </div>
  );
}
