"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Calendar } from "lucide-react";
import { OpportunityTimeline } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Vertical visual timeline for the sequential phases of an opportunity.
 * Renders glowing status icons, phase dates, and descriptions.
 */
export default function TimelineView({ items }: { items: OpportunityTimeline[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-sm text-white/40 py-6 text-center border border-dashed border-white/10 rounded-xl">
        Timeline details are not available yet. Check back soon.
      </div>
    );
  }

  return (
    <ol className="relative border-l border-white/10 ml-3 space-y-8">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <motion.li
            key={`${item.phase}-${index}`}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: index * 0.08 }}
            className="relative pl-8"
          >
            {/* Glowing node */}
            <span
              className={cn(
                "absolute -left-[9px] top-1 flex items-center justify-center rounded-full",
                isLast
                  ? "w-4.5 h-4.5 text-[#5CE3B6]"
                  : "w-4 h-4 bg-[#3352CD] border border-[#5CE3B6]/50 shadow-[0_0_12px_rgba(92,227,182,0.6)]"
              )}
            >
              {isLast ? <CheckCircle2 className="w-5 h-5" /> : null}
            </span>

            <div className="glass rounded-xl px-4 py-3 border border-white/10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h4 className="text-sm font-semibold text-white font-heading">{item.phase}</h4>
                {item.date && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#5CE3B6]">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mt-1.5 text-sm text-white/55 leading-relaxed">{item.description}</p>
              )}
            </div>
          </motion.li>
        );
      })}

      {/* End cap */}
      <li className="relative pl-8">
        <span className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-white/10 border border-white/20" />
        <p className="flex items-center gap-2 text-xs text-white/40">
          <Clock className="w-3.5 h-3.5" /> Stay tuned for updates
        </p>
      </li>
    </ol>
  );
}