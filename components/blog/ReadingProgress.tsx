"use client";
import { useEffect, useRef } from "react";

/** Thin bar fixed under the header. Tracks how far through #article-body the reader is. */
export default function ReadingProgress({ targetId = "article-body" }: { targetId?: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const done = total <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / total));
      if (bar.current) bar.current.style.transform = `scaleX(${done})`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, [targetId]);
  return (
    <div className="print:hidden pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-transparent" role="progressbar" aria-label="Reading progress" aria-hidden="true">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-brand-600" />
    </div>
  );
}
