"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { PATH } from "@/lib/pkm-content";

/** Four-stage path from idea to national PKM. Click or use arrow keys to move between stages. */
export default function PathStepper({ dark = false }: { dark?: boolean }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const cur = PATH[i]!;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setI((x) => Math.min(PATH.length - 1, x + 1));
    if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
  };
  return (
    <div>
      <div role="tablist" aria-label="PKM path" onKeyDown={onKey} className="grid grid-cols-4 gap-2">
        {PATH.map((p, idx) => {
          const done = idx < i, on = idx === i;
          return (
            <button key={p.id} role="tab" aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => setI(idx)} className="group text-left focus-visible:outline-none">
              <div className="flex items-center gap-2">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  on ? "bg-mint text-navy" : done ? "bg-brand-600 text-white" : dark ? "bg-white/10 text-slate-300" : "bg-slate-200 text-slate-600")}>
                  {done ? <Check className="h-4 w-4" /> : idx + 1}
                </span>
                <span className={cn("h-0.5 flex-1 rounded-full transition-colors", idx < i ? "bg-brand-600" : dark ? "bg-white/15" : "bg-slate-200", idx === PATH.length - 1 && "hidden")} />
              </div>
              <span className={cn("mt-2 block text-xs font-semibold sm:text-sm", on ? (dark ? "text-white" : "text-slate-900") : dark ? "text-slate-400" : "text-slate-500")}>{p.short}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className={cn("mt-5 min-h-[9.5rem] rounded-xl border p-5", dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white")}>
        <AnimatePresence mode="wait">
          <motion.div key={cur.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <p className={cn("text-xs font-semibold uppercase tracking-wide", dark ? "text-mint" : "text-brand-700")}>{cur.when}{"planned" in cur && cur.planned ? " · planned for 2026/27" : ""}</p>
            <h3 className={cn("mt-1 text-lg font-bold font-heading", dark ? "text-white" : "text-slate-900")}>{cur.step}</h3>
            <p className={cn("mt-2 text-sm leading-6", dark ? "text-slate-300" : "text-slate-600")}>{cur.text}</p>
            <p className={cn("mt-3 text-xs", dark ? "text-slate-400" : "text-slate-500")}>You leave with: <span className={dark ? "text-cream" : "font-semibold text-slate-800"}>{cur.out}</span></p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
