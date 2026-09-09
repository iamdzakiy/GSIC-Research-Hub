"use client";

import { motion } from "framer-motion";

/**
 * Ambient animated color mesh background. Renders large blurred orbs
 * (`#3352CD`, `#5CE3B6`, `#8B5CF6`) that slowly drift, giving depth behind
 * glassmorphism cards. Rendered behind content via `-z-10`.
 */
export default function AnimatedMeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Base gradient wash */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#0F172A_0%,#0B1120_70%)]" />

      {/* Drifting orbs */}
      <motion.div
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-[#3352CD]/25 blur-[140px]"
      />
      <motion.div
        animate={{ x: [0, -70, 50, 0], y: [0, 50, -40, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 -right-52 h-[34rem] w-[34rem] rounded-full bg-[#5CE3B6]/15 blur-[150px]"
      />
      <motion.div
        animate={{ x: [0, 60, -50, 0], y: [0, -40, 50, 0], scale: [1, 1.1, 0.92, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-[#8B5CF6]/15 blur-[150px]"
      />

      {/* Fine grid texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}