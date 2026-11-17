"use client";
import { useId } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/cn";
import { DUR, EASE_OUT } from "@/lib/motion";
import { LogoGradientDef } from "@/components/motion/Progress";
import CountUp from "@/components/portal/CountUp";

/** Circular score meter. The ring fills and the number counts up once. `tone="logo"` is the post-test / result ring. */
export default function ScoreRing({ percent, label, tone = "brand", size = 104 }: { percent: number | null; label: string; tone?: "brand" | "mint" | "logo"; size?: number }) {
  const id = useId();
  const r = (size - 12) / 2, c = 2 * Math.PI * r;
  const p = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  const stroke = tone === "brand" ? "rgb(var(--brand-600))" : `url(#${id})`;
  return (
    <figure className="flex flex-col items-center" aria-label={`${label}: ${percent === null ? "not taken" : percent + " percent"}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
          <defs><LogoGradientDef id={id} /></defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--ink-1) / 0.1)" strokeWidth={8} />
          <m.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth={8} strokeLinecap="round" strokeDasharray={c}
            initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - p / 100) }} transition={{ duration: DUR.setPiece, ease: EASE_OUT }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className={cn("font-display text-2xl font-extrabold", percent === null ? "text-slate-300" : "text-ink")}>{percent === null ? "—" : <CountUp value={p} />}{percent !== null && <span className="text-sm font-semibold text-ink-3">%</span>}</span>
        </div>
      </div>
      <figcaption className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-3">{label}</figcaption>
    </figure>
  );
}
