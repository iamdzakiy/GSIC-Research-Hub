"use client";
import { LazyMotion, MotionConfig } from "framer-motion";
import { DUR, EASE_OUT } from "@/lib/motion";

const load = () => import("./features").then((m) => m.default);

/** One motion context per route shell. `m.*` components only; `reducedMotion="user"` turns movement into fades. */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={load} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: DUR.base, ease: EASE_OUT }}>{children}</MotionConfig>
    </LazyMotion>
  );
}
