"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { EPISODES } from "@/lib/pkm-content";

/** Accordion of the four bootcamp episodes with a workshop/theory bar. */
export default function BootcampEpisodes() {
  const [open, setOpen] = useState<number>(1);
  const reduce = useReducedMotion();
  return (
    <ul className="space-y-3">
      {EPISODES.map((e) => {
        const on = open === e.n;
        return (
          <li key={e.n} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button type="button" aria-expanded={on} aria-controls={`ep-${e.n}`} onClick={() => setOpen(on ? 0 : e.n)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors", on ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700")}>{e.n}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">Episode {e.n}: {e.title}</span>
                <span className="mt-1.5 flex items-center gap-3">
                  <span className="text-xs text-slate-500">{e.hours}</span>
                  <span className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-200" role="img" aria-label={`${e.workshop}% workshop`}>
                    <span className="block h-full rounded-full bg-mint" style={{ width: `${e.workshop}%` }} />
                  </span>
                  <span className="text-xs text-slate-500">{e.workshop}% workshop</span>
                </span>
              </span>
              <ChevronDown className={cn("h-5 w-5 shrink-0 text-slate-400 transition-transform", on && "rotate-180")} aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div id={`ep-${e.n}`} initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduce ? undefined : { height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <div className="grid gap-5 border-t border-slate-100 px-5 py-5 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Workshop</p>
                      <ul className="mt-2 space-y-1.5 text-slate-700">{e.work.map((w) => <li key={w} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-600" aria-hidden="true" />{w}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Theory</p>
                      <p className="mt-2 text-slate-700">{e.theory}</p>
                      <p className="mt-4 rounded-lg bg-cream-100 px-3 py-2 text-xs text-slate-800">{e.task}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
