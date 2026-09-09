"use client";

import { cn } from "@/lib/cn";

/**
 * COMPFEST-style pulse-loading skeleton. Renders shimmering placeholder blocks
 * that mirror the layout of a typical content card.
 */
export default function SkeletonCard({
  className,
  lines = 3,
  showMedia = true,
}: {
  className?: string;
  lines?: number;
  showMedia?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass rounded-2xl border border-white/10 p-5 overflow-hidden animate-pulse",
        className
      )}
      aria-hidden
    >
      {showMedia && (
        <div className="h-40 w-full rounded-xl bg-white/5 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
      )}

      <div className="flex gap-1.5 mb-3">
        <div className="h-4 w-16 rounded-full bg-white/10" />
        <div className="h-4 w-10 rounded-full bg-white/5" />
      </div>

      <div className="h-5 w-3/4 rounded-md bg-white/10 mb-3" />

      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3 rounded-md bg-white/[0.06] mb-2",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}

      <div className="mt-4 flex gap-2">
        <div className="h-8 w-20 rounded-full bg-white/5" />
        <div className="h-8 w-16 rounded-full bg-white/5" />
      </div>
    </div>
  );
}