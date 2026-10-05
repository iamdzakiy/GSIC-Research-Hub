"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface GalleryEntry { id: string; title: string; caption: string | null; imageUrl: string; eventLabel: string | null }

/** Auto-scrolling photo strip (CSS-only motion, pauses on hover/focus, static under reduced motion) + lightbox. */
export default function GalleryMarquee({ items }: { items: GalleryEntry[] }) {
  const [open, setOpen] = useState<GalleryEntry | null>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);
  if (!items.length) return null;
  const loop = items.length >= 4 ? [...items, ...items] : items;
  const animated = items.length >= 4;
  return (
    <>
      <style>{`@keyframes gsic-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.gsic-track{animation:gsic-marquee ${Math.max(30, items.length * 7)}s linear infinite}.gsic-wrap:hover .gsic-track,.gsic-wrap:focus-within .gsic-track{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.gsic-track{animation:none}.gsic-wrap{overflow-x:auto}}`}</style>
      <div className="gsic-wrap overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <ul className={`flex w-max gap-4 ${animated ? "gsic-track" : ""}`}>
          {loop.map((g, i) => (
            <li key={`${g.id}-${i}`} aria-hidden={animated && i >= items.length ? true : undefined}>
              <button type="button" onClick={() => setOpen(g)} tabIndex={animated && i >= items.length ? -1 : 0} className="group relative block h-44 w-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:h-52 sm:w-72">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.imageUrl} alt={g.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-transparent p-3 text-left">
                  <span className="block truncate text-sm font-semibold text-white">{g.title}</span>
                  {g.eventLabel && <span className="block truncate text-xs text-mint">{g.eventLabel}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={open.title} className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 p-4" onClick={() => setOpen(null)}>
          <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.imageUrl} alt={open.title} className="max-h-[75vh] rounded-xl object-contain" />
            <figcaption className="mt-3 text-center text-white"><p className="font-semibold">{open.title}</p>{open.caption && <p className="mt-1 text-sm text-slate-300">{open.caption}</p>}</figcaption>
          </figure>
          <button type="button" aria-label="Tutup" onClick={() => setOpen(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"><X className="h-5 w-5" /></button>
        </div>
      )}
    </>
  );
}
