"use client";
import { m } from "framer-motion";
import { DUR, EASE_OUT, RISE, STAGGER } from "@/lib/motion";

/** Rises 12 px and fades in once when scrolled into view. `index` staggers siblings by 40 ms. `delay` (seconds) still works. */
export default function Reveal({ children, delay, index = 0, className }: { children: React.ReactNode; delay?: number; index?: number; className?: string }) {
  return (
    <m.div className={className} initial={{ opacity: 0, y: RISE }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: DUR.slow, delay: delay ?? Math.min(index, 8) * STAGGER, ease: EASE_OUT }}>
      {children}
    </m.div>
  );
}
