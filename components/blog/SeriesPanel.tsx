"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

export interface PanelPart { slug: string; title: string }
export const readKey = (series: string) => `gsic:series-read:${series}`;
export function readSlugs(series: string): string[] {
  try { const v = JSON.parse(localStorage.getItem(readKey(series)) ?? "[]"); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; }
}

/** All parts of a series, the current one marked, a tick on parts this browser has read to the end, and Previous/Next. */
export default function SeriesPanel({ series, parts, current }: { series: string; parts: PanelPart[]; current: string }) {
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => {
    setRead(readSlugs(series));
    const on = (e: Event) => { if ((e as CustomEvent<string>).detail === series) setRead(readSlugs(series)); };
    window.addEventListener("series-read", on);
    return () => window.removeEventListener("series-read", on);
  }, [series]);
  const idx = parts.findIndex((p) => p.slug === current);
  const prev = idx > 0 ? parts[idx - 1] : null, next = idx >= 0 && idx < parts.length - 1 ? parts[idx + 1] : null;
  return (
    <aside aria-label={`${series} series`} className="print:hidden rounded-xl border border-slate-200 bg-white p-5">
      <p className="label-mono text-brand-700">{series}</p>
      <p className="mt-1 text-sm text-slate-600">{parts.length} parts</p>
      <ol className="mt-4 space-y-1">
        {parts.map((p, i) => {
          const here = p.slug === current, done = read.includes(p.slug);
          return (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} aria-current={here ? "page" : undefined} lang="id"
                className={`flex items-start gap-3 rounded-lg px-2 py-2 text-sm leading-snug transition-colors ${here ? "bg-brand-50 font-semibold text-brand-800" : "text-slate-700 hover:bg-slate-50"}`}>
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold ${here ? "border-brand-600 bg-brand-600 text-white" : done ? "border-mint-600 bg-mint-100 text-mint-800" : "border-slate-300 text-slate-500"}`}>
                  {done && !here ? <Check className="h-3.5 w-3.5" aria-label="Read" /> : i + 1}
                </span>
                <span>{p.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      {(prev || next) && (
        <div className="mt-4 flex items-stretch justify-between gap-3 border-t border-slate-200 pt-4 text-sm">
          {prev ? <Link href={`/blog/${prev.slug}`} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-brand-700 hover:text-brand-800"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Previous</Link> : <span />}
          {next ? <Link href={`/blog/${next.slug}`} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-brand-700 hover:text-brand-800">Next<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : <span />}
        </div>
      )}
    </aside>
  );
}
