"use client";
import { m, useScroll, useSpring } from "framer-motion";

/** Reading progress under the header. It is a progress indicator, so it carries the logo gradient. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });
  return <m.div aria-hidden="true" style={{ scaleX }} className="no-print fixed inset-x-0 top-16 z-50 h-0.5 origin-left bg-logo-gradient" />;
}
