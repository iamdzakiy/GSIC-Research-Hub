"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Drifting network of nodes behind the hero. Nodes link when close; the pointer pulls nearby nodes.
 * Draws one still frame under prefers-reduced-motion and pauses when off screen or the tab is hidden.
 */
export default function HeroField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let w = 0, h = 0, raf = 0, visible = true;
    const mouse = { x: -999, y: -999 };
    type N = { x: number; y: number; vx: number; vy: number; r: number; hue: number };
    let nodes: N[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(24, Math.min(70, Math.round((w * h) / 16000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: 1.2 + Math.random() * 1.8, hue: Math.random() < 0.22 ? 1 : 0,
      }));
    };

    const draw = (move: boolean) => {
      ctx.clearRect(0, 0, w, h);
      const link = 120;
      for (const n of nodes) {
        if (move) {
          const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
          if (d < 160 && d > 1) { n.vx += (dx / d) * 0.006; n.vy += (dy / d) * 0.006; }
          n.vx *= 0.995; n.vy *= 0.995;
          n.x += n.vx; n.y += n.vy;
          if (n.x < -10) n.x = w + 10; if (n.x > w + 10) n.x = -10;
          if (n.y < -10) n.y = h + 10; if (n.y > h + 10) n.y = -10;
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!, b = nodes[j]!, d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) {
            ctx.strokeStyle = `rgba(92,227,182,${(1 - d / link) * 0.28})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = n.hue ? "rgba(242,248,201,0.9)" : "rgba(92,227,182,0.75)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    };

    const loop = () => { if (visible && !document.hidden) draw(true); raf = requestAnimationFrame(loop); };
    resize();
    draw(false);
    if (!reduce) raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onLeave = () => { mouse.x = mouse.y = -999; };
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; });
    io.observe(canvas);
    const ro = new ResizeObserver(() => { resize(); draw(false); });
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerleave", onLeave);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); window.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
