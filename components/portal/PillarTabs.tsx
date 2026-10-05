"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { PILLARS } from "@/lib/pkm-content";

/** The three GSIC Research pillars as an interactive tab set. */
export default function PillarTabs() {
  const [id, setId] = useState<string>(PILLARS[0].id);
  const reduce = useReducedMotion();
  const cur = PILLARS.find((p) => p.id === id)!;
  return (
    <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
      <div role="tablist" aria-orientation="vertical" aria-label="GSIC Research pillars" className="flex gap-2 md:flex-col">
        {PILLARS.map((p) => (
          <button key={p.id} role="tab" aria-selected={p.id === id} onClick={() => setId(p.id)}
            className={cn("flex-1 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 md:flex-none",
              p.id === id ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-brand-300")}>
            {p.name}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="rounded-xl border border-slate-200 bg-white p-6">
        <AnimatePresence mode="wait">
          <motion.div key={cur.id} initial={reduce ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.2 }}>
            <h3 className="text-lg font-bold font-heading text-slate-900">{cur.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{cur.line}</p>
            <ul className="mt-4 space-y-2.5">
              {cur.points.map((t) => (
                <li key={t} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-600" aria-hidden="true" />{t}</li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
