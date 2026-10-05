"use client";
import { useEffect, useRef } from "react";

const COLORS = ["#3352CD", "#5CE3B6", "#F2F8C9", "#93A8EE", "#8DEBCF", "#FFFFFF"];

/** Dependency-free canvas confetti in the GSIC palette. Plays once, then unmounts its own frame loop. */
export default function Confetti({ active, count = 110, duration = 2800 }: { active: boolean; count?: number; duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const ps = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.4, w: 6 + Math.random() * 6, h: 4 + Math.random() * 5,
      vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2, r: Math.random() * 6, vr: -0.2 + Math.random() * 0.4,
      c: COLORS[(Math.random() * COLORS.length) | 0]!, s: Math.random() * 6,
    }));
    const t0 = performance.now(); let raf = 0;
    const tick = (t: number) => {
      const el = t - t0; ctx.clearRect(0, 0, innerWidth, innerHeight);
      const fade = el > duration - 600 ? Math.max(0, (duration - el) / 600) : 1;
      ctx.globalAlpha = fade;
      for (const p of ps) {
        p.y += p.vy; p.x += p.vx + Math.sin((p.s += 0.05)) * 0.8; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (el < duration) raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, count, duration]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] h-full w-full" />;
}
