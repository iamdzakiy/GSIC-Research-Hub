"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { GalleryEntry } from "@/components/portal/GalleryMarquee";

/** Filterable photo grid with a keyboard-friendly lightbox (arrows, Escape). */
export default function GalleryGrid({ items }: { items: GalleryEntry[] }) {
  const labels = useMemo(() => Array.from(new Set(items.map((i) => i.eventLabel).filter((x): x is string => !!x))), [items]);
  const [label, setLabel] = useState<string>("All");
  const [idx, setIdx] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const shown = label === "All" ? items : items.filter((i) => i.eventLabel === label);

  useEffect(() => {
    if (idx === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIdx(null);
      if (e.key === "ArrowRight") setIdx((i) => (i === null ? i : (i + 1) % shown.length));
      if (e.key === "ArrowLeft") setIdx((i) => (i === null ? i : (i - 1 + shown.length) % shown.length));
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [idx, shown.length]);

  const cur = idx === null ? null : shown[idx];
  return (
    <>
      {labels.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by event">
          {["All", ...labels].map((l) => (
            <button key={l} type="button" aria-pressed={l === label} onClick={() => setLabel(l)}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", l === label ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-brand-400")}>{l}</button>
          ))}
        </div>
      )}
      <motion.ul layout={!reduce} className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
        <AnimatePresence>
          {shown.map((g, i) => (
            <motion.li key={g.id} layout={!reduce} initial={reduce ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }} className="break-inside-avoid">
              <button type="button" onClick={() => setIdx(i)} className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.imageUrl} alt={g.title} loading="lazy" className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 translate-y-1 bg-navy/85 p-3 text-left opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  <span className="block truncate text-sm font-semibold text-white">{g.title}</span>
                  {g.eventLabel && <span className="block truncate text-xs text-mint">{g.eventLabel}</span>}
                </span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {cur && (
        <div role="dialog" aria-modal="true" aria-label={cur.title} className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/95 p-4" onClick={() => setIdx(null)}>
          <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cur.imageUrl} alt={cur.title} className="max-h-[75vh] rounded-xl object-contain" />
            <figcaption className="mt-3 text-center text-white"><p className="font-semibold">{cur.title}</p>{cur.caption && <p className="mt-1 text-sm text-slate-300">{cur.caption}</p>}<p className="mt-1 text-xs text-slate-400">{(idx ?? 0) + 1} of {shown.length}</p></figcaption>
          </figure>
          <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setIdx((i) => ((i ?? 0) - 1 + shown.length) % shown.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronLeft className="h-6 w-6" /></button>
          <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setIdx((i) => ((i ?? 0) + 1) % shown.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronRight className="h-6 w-6" /></button>
          <button type="button" aria-label="Close" onClick={() => setIdx(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
        </div>
      )}
    </>
  );
}
