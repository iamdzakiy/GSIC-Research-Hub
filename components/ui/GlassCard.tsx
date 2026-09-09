"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  /** Renders a subtle animated glow outline on hover. */
  glow?: boolean;
  /** Disables the default hover lift. */
  noHover?: boolean;
}

/**
 * Reusable COMPFEST-style glassmorphism card with Framer Motion micro-interactions
 * (scroll reveal + hover lift).
 */
export default function GlassCard({
  children,
  className,
  glow = false,
  noHover = false,
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={noHover ? undefined : { y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "glass rounded-2xl border border-white/10 relative overflow-hidden",
        !noHover && "card-hover",
        glow && "glow-border",
        className
      )}
      {...rest}
    >
      {/* Ambient corner glow accent */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#3352CD]/10 blur-3xl" />
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}