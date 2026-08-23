"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, ExternalLink, Layers, Building2, Clock } from "lucide-react";
import { Opportunity } from "@/lib/types";
import { getTypeLabel } from "@/lib/data";
import CountdownTimer from "@/components/CountdownTimer";

interface OpportunityCardProps {
  opp: Opportunity;
  index?: number;
  onExpire?: (id: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  research: "bg-[#5CE3B6]/15 text-[#5CE3B6] border-[#5CE3B6]/30",
  scholarship: "bg-[#F2F8C9]/15 text-[#F2F8C9] border-[#F2F8C9]/30",
  career: "bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30",
  competition: "bg-[#3352CD]/15 text-[#60A5FA] border-[#3352CD]/30",
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "● Live", className: "bg-[#5CE3B6]/15 text-[#5CE3B6] border-[#5CE3B6]/30" },
  upcoming: { label: "● Upcoming", className: "bg-[#F2F8C9]/15 text-[#F2F8C9] border-[#F2F8C9]/30" },
  ongoing: { label: "● Ongoing", className: "bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30" },
  archived: { label: "● Archived", className: "bg-white/5 text-white/40 border-white/10" },
  completed: { label: "● Completed", className: "bg-white/5 text-white/40 border-white/10" },
};

export default function OpportunityCard({ opp, index = 0, onExpire }: OpportunityCardProps) {
  const isArchived = opp.status === "archived";
  const badge = STATUS_BADGES[opp.status] || STATUS_BADGES.active;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className={`glass rounded-2xl p-5 card-hover glow-border relative overflow-hidden ${
        isArchived ? "opacity-60" : ""
      }`}
    >
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#3352CD]/10 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between gap-2 mb-3 relative">
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${TYPE_COLORS[opp.type] || TYPE_COLORS.research}`}>
            {getTypeLabel(opp.type)}
          </span>
          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>

      <h3 className="text-base font-bold leading-snug font-heading relative">{opp.title}</h3>
      <div className="flex items-center gap-1.5 text-xs text-white/40 mt-1 relative">
        <Building2 className="w-3 h-3" />
        {opp.organizer}
      </div>

      <p className="text-xs text-white/50 mt-2 line-clamp-2 relative">{opp.description}</p>

      {/* Countdown */}
      <div className="mt-4 relative">
        {isArchived ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Archived
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#5CE3B6]" />
            <CountdownTimer
              targetDate={opp.deadline}
              compact
              onExpire={() => onExpire?.(opp.id)}
            />
          </div>
        )}
      </div>

      {/* Skills */}
      {opp.requiredSkills && opp.requiredSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 relative">
          {opp.requiredSkills.slice(0, 4).map((s) => (
            <span key={s} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/40">
              {s}
            </span>
          ))}
          {opp.requiredSkills.length > 4 && (
            <span className="text-[10px] text-white/30">+{opp.requiredSkills.length - 4}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2 relative">
        <Link
          href={`/opportunities/${opp.slug || opp.id}`}
          className="text-xs bg-[#3352CD]/30 hover:bg-[#3352CD]/50 px-3 py-1.5 rounded-full transition flex items-center gap-1"
        >
          <Layers className="w-3 h-3" /> Details
        </Link>
        {opp.link && !isArchived && (
          <a
            href={opp.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-[#5CE3B6]/15 hover:bg-[#5CE3B6]/25 text-[#5CE3B6] px-3 py-1.5 rounded-full transition flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" /> Apply
          </a>
        )}
      </div>
    </motion.div>
  );
}