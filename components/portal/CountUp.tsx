"use client";
import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { DUR, EASE_OUT } from "@/lib/motion";

/** Number that counts up once when scrolled into view. Shows the final value at once under prefers-reduced-motion. */
export default function CountUp({ value, suffix = "", duration = DUR.setPiece }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!inView || reduce) { if (reduce) setN(value); return; }
    started.current = true;
    const c = animate(0, value, { duration, ease: EASE_OUT, onUpdate: (x) => setN(Math.round(x)) });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, duration, reduce]);
  // The final value is laid out invisibly, so the box never changes size while the visible number counts.
  return (
    <span ref={ref} className="tnum relative inline-block">
      <span className="invisible" aria-hidden="true">{value}{suffix}</span>
      <span className="absolute inset-0" aria-hidden="true">{reduce ? value : n}{suffix}</span>
      <span className="sr-only">{value}{suffix}</span>
    </span>
  );
}
