"use client";
import { cn } from "@/lib/cn";
import type { PublicQuestion } from "@/lib/assessments";

type Value = string | string[];

const optBase = "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600";
const optOn = "border-brand-600 bg-brand-50 text-ink";
const optOff = "border-slate-300 bg-white text-ink-2 hover:border-slate-400";

/** One question's answer control. Content is Indonesian, so it is marked `lang="id"`. Keys 1–9 pick an option (handled by the runner). */
export default function QuestionInput({ q, value, onChange, error }: { q: PublicQuestion; value: Value | undefined; onChange: (v: Value) => void; error?: string }) {
  const labelId = `q-${q.id}-label`;
  const str = Array.isArray(value) ? "" : value ?? "";

  let body: React.ReactNode = null;
  if ((q.type === "multiple_choice" || q.type === "single_choice") && q.options) {
    body = (
      <div role="radiogroup" aria-labelledby={labelId} className="space-y-2">
        {q.options.map((o, i) => (
          <button key={o} type="button" role="radio" aria-checked={str === o} onClick={() => onChange(o)} className={cn(optBase, str === o ? optOn : optOff)}>
            <span aria-hidden="true" className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold", str === o ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600")}>{i + 1}</span>
            <span lang="id">{o}</span>
          </button>
        ))}
      </div>
    );
  } else if (q.type === "multi_select" && q.options) {
    const set = Array.isArray(value) ? value : [];
    body = (
      <div role="group" aria-labelledby={labelId} className="space-y-2">
        {q.options.map((o) => {
          const on = set.includes(o);
          return (
            <button key={o} type="button" role="checkbox" aria-checked={on} onClick={() => onChange(on ? set.filter((x) => x !== o) : [...set, o])} className={cn(optBase, on ? optOn : optOff)}>
              <span aria-hidden="true" className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs", on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white")}>{on ? "✓" : ""}</span>
              <span lang="id">{o}</span>
            </button>
          );
        })}
      </div>
    );
  } else if (q.type === "likert") {
    const n = q.scale ?? 5;
    body = (
      <div role="radiogroup" aria-labelledby={labelId}>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {Array.from({ length: n }, (_, i) => String(i + 1)).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={str === v} aria-label={`${v} of ${n}`} onClick={() => onChange(v)} className={cn("h-12 rounded-xl border text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600", str === v ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-ink-2 hover:border-slate-400")}>{v}</button>
          ))}
        </div>
        {(q.lowLabel || q.highLabel) && <div lang="id" className="mt-2 flex justify-between gap-4 text-xs text-ink-3"><span>{q.lowLabel}</span><span className="text-right">{q.highLabel}</span></div>}
      </div>
    );
  } else if (q.type === "nps") {
    body = (
      <div role="radiogroup" aria-labelledby={labelId}>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
          {Array.from({ length: 11 }, (_, i) => String(i)).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={str === v} onClick={() => onChange(v)} className={cn("h-11 rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600", str === v ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-ink-2 hover:border-slate-400")}>{v}</button>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-3"><span>0</span><span>10</span></div>
      </div>
    );
  } else if (q.type === "short_text") {
    body = <input aria-labelledby={labelId} lang="id" value={str} maxLength={q.maxLength ?? 200} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />;
  } else if (q.type === "long_text" || q.type === "essay") {
    const max = q.maxLength ?? 2000;
    body = (
      <div>
        <textarea aria-labelledby={labelId} lang="id" rows={5} value={str} maxLength={max} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />
        <p className="mt-1 text-right text-xs text-ink-3">{str.length}/{max}</p>
      </div>
    );
  }

  return (
    <div>
      <p id={labelId} lang="id" className="font-display text-lg font-semibold leading-snug text-ink">
        {q.text}
        {q.required && <span className="sr-only"> (required)</span>}
      </p>
      {q.required && <p className="mt-1 text-xs text-ink-3" aria-hidden="true">Required</p>}
      <div className="mt-4">{body}</div>
      <p role="alert" className="mt-2 min-h-[1.25rem] text-xs text-rose-600">{error ?? ""}</p>
    </div>
  );
}
