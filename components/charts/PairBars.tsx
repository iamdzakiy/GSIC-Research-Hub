"use client";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export interface PairDatum { label: string; a: number | null; b: number | null }

/**
 * Grouped bars drawn in SVG with brand colours. A table view is one tap away, so the numbers are reachable without sight.
 * Used for pre and post per episode, and for the admin score comparisons.
 */
export default function PairBars({ data, aLabel = "Pre-test", bLabel = "Post-test", max = 100, unit = "", caption }: { data: PairDatum[]; aLabel?: string; bLabel?: string; max?: number; unit?: string; caption: string }) {
  const [table, setTable] = useState(false);
  const id = useId();
  const W = 480, H = 200, padL = 28, padB = 28, padT = 8;
  const innerH = H - padB - padT, slot = (W - padL) / Math.max(1, data.length), bw = Math.min(28, slot / 3);
  const y = (v: number) => padT + innerH - (Math.max(0, Math.min(max, v)) / max) * innerH;
  return (
    <figure>
      <div className="flex items-center justify-between gap-3">
        <figcaption id={id} className="text-sm font-semibold text-ink">{caption}</figcaption>
        <button type="button" onClick={() => setTable((v) => !v)} aria-pressed={table} className="text-xs font-medium text-brand-700 hover:underline print:hidden">{table ? "Show chart" : "Show table"}</button>
      </div>
      {table ? (
        <table className="mt-3 w-full text-sm" aria-labelledby={id}>
          <thead><tr className="text-left text-xs text-ink-3"><th className="py-1 font-medium">&nbsp;</th><th className="py-1 font-medium">{aLabel}</th><th className="py-1 font-medium">{bLabel}</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.label} className="border-t border-slate-100"><th scope="row" className="py-1.5 text-left font-medium text-ink-2">{d.label}</th><td>{d.a ?? "–"}{d.a != null ? unit : ""}</td><td>{d.b ?? "–"}{d.b != null ? unit : ""}</td></tr>)}</tbody>
        </table>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id} className="mt-3 h-auto w-full">
            {[0, 0.5, 1].map((f) => <g key={f}><line x1={padL} x2={W} y1={y(max * f)} y2={y(max * f)} stroke="rgb(var(--slate-200, 226 232 240))" strokeWidth="1" /><text x={padL - 6} y={y(max * f) + 4} textAnchor="end" fontSize="10" fill="rgb(var(--ink-3, 100 116 139))">{Math.round(max * f)}</text></g>)}
            {data.map((d, i) => {
              const cx = padL + slot * i + slot / 2;
              return (
                <g key={d.label}>
                  {d.a != null && <rect x={cx - bw - 2} y={y(d.a)} width={bw} height={Math.max(1, padT + innerH - y(d.a))} rx="3" fill="rgb(var(--brand-600))" />}
                  {d.b != null && <rect x={cx + 2} y={y(d.b)} width={bw} height={Math.max(1, padT + innerH - y(d.b))} rx="3" fill="rgb(var(--mint-600, 16 185 129))" />}
                  <text x={cx} y={H - 10} textAnchor="middle" fontSize="11" fill="rgb(var(--ink-2, 51 65 85))">{d.label}</text>
                </g>
              );
            })}
          </svg>
          <p className={cn("mt-1 flex gap-4 text-xs text-ink-3")}><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgb(var(--brand-600))" }} />{aLabel}</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgb(var(--mint-600, 16 185 129))" }} />{bLabel}</span></p>
        </>
      )}
    </figure>
  );
}
