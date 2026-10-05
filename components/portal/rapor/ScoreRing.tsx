"use client";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/** Animated circular score meter (SVG). `tone` follows the palette: brand = pre-test, mint = post-test. */
export default function ScoreRing({ percent, label, tone = "brand", size = 104 }: { percent: number | null; label: string; tone?: "brand" | "mint"; size?: number }) {
  const reduce = useReducedMotion();
  const r = (size - 12) / 2, c = 2 * Math.PI * r;
  const p = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  const stroke = tone === "mint" ? "#5CE3B6" : "#3352CD";
  return (
    <figure className="flex flex-col items-center" aria-label={`${label}: ${percent === null ? "not taken" : percent + " percent"}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={8} />
          <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth={8} strokeLinecap="round" strokeDasharray={c}
            initial={{ strokeDashoffset: reduce ? c * (1 - p / 100) : c }} animate={{ strokeDashoffset: c * (1 - p / 100) }} transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-display text-2xl font-extrabold", percent === null ? "text-slate-300" : "text-slate-900")}>{percent === null ? "—" : p}{percent !== null && <span className="text-sm font-semibold text-slate-500">%</span>}</span>
        </div>
      </div>
      <figcaption className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</figcaption>
    </figure>
  );
}
