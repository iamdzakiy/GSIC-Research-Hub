"use client";
import { m } from "framer-motion";
import { DUR } from "@/lib/motion";

/** Re-mounts on every navigation, so each page cross-fades in. Opacity only: no layout shift, and fine under reduced motion. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: DUR.base, ease: "easeOut" }}>{children}</m.div>;
}
