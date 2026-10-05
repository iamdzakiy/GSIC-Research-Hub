"use client";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/** Thin reading-progress bar pinned under the header. */
export default function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });
  if (reduce) return null;
  return <motion.div aria-hidden="true" style={{ scaleX }} className="fixed inset-x-0 top-16 z-50 h-0.5 origin-left bg-mint" />;
}
