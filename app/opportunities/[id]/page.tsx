"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getOpportunities } from "@/services/opportunities";
import { Opportunity } from "@/lib/types";
import Navbar from "@/components/Navbar";
import CountdownTimer from "@/components/CountdownTimer";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
  Calendar,
  User,
  Link as LinkIcon,
  Tag,
  CheckCircle,
  Share2,
  Copy,
  Check,
  Building2,
  Phone,
  Mail,
  ArrowLeft,
  Clock,
  Sparkles,
  ListChecks,
  Gift,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  research: { label: "Research", color: "text-[#5CE3B6] bg-[#5CE3B6]/10 border-[#5CE3B6]/30", icon: "🔬" },
  scholarship: { label: "Scholarship", color: "text-[#F2F8C9] bg-[#F2F8C9]/10 border-[#F2F8C9]/30", icon: "🎓" },
  career: { label: "Career", color: "text-[#A78BFA] bg-[#8B5CF6]/10 border-[#8B5CF6]/30", icon: "💼" },
  competition: { label: "Competition", color: "text-[#60A5FA] bg-[#3352CD]/10 border-[#3352CD]/30", icon: "🏆" },
};

export default function OpportunityDetail() {
  const { id } = useParams();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      getOpportunities().then((opps) => {
        const found = opps.find((o) => o.id === id || o.slug === id);
        setOpp(found || null);
        setLoading(false);
      });
    }
  }, [id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Share failed", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient font-body pt-20 mesh-gradient">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#5CE3B6] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="min-h-screen bg-hero-gradient font-body pt-20 mesh-gradient">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-400/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-heading mb-2">Opportunity Not Found</h1>
          <p className="text-white/50 mb-6">This opportunity may have been removed or the link is incorrect.</p>
          <Link href="/#opportunities" className="inline-flex items-center gap-2 bg-[#3352CD] hover:bg-[#4a6cf7] px-6 py-2.5 rounded-full transition font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Opportunities
          </Link>
        </div>
      </div>
    );
  }

  const typeMeta = TYPE_META[opp.type] || TYPE_META.research;
  const isArchived = opp.status === "archived";

  return (
    <div className="min-h-screen bg-hero-gradient font-body pt-20 mesh-gradient">
      <Navbar />

      <div className="fixed w-[600px] h-[600px] rounded-full bg-[#3352CD] opacity-[0.06] blur-[100px] pointer-events-none -top-[250px] -left-[250px] animate-float-blob z-0" />
      <div className="fixed w-[450px] h-[450px] rounded-full bg-[#5CE3B6] opacity-[0.06] blur-[100px] pointer-events-none -bottom-[200px] -right-[200px] animate-float-blob z-0" style={{ animationDelay: "8s" }} />

      <main className="max-w-4xl mx-auto px-4 py-10 relative z-10">
        {/* Back link */}
        <Link href="/#opportunities" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition mb-6">
          <ArrowLeft className="w-4 h-4" /> All Opportunities
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl overflow-hidden glow-border">
          {/* Cover header */}
          <div className="relative h-40 sm:h-56 bg-gradient-to-br from-[#3352CD]/40 via-[#5CE3B6]/20 to-[#8B5CF6]/30 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/1.png')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`text-xs px-3 py-1 rounded-full border font-medium ${typeMeta.color}`}>
                    {typeMeta.icon} {typeMeta.label}
                  </span>
                  {!isArchived && (
                    <span className="text-xs px-3 py-1 rounded-full border bg-[#5CE3B6]/15 text-[#5CE3B6] border-[#5CE3B6]/30 font-medium">
                      ● Live
                    </span>
                  )}
                  {isArchived && (
                    <span className="text-xs px-3 py-1 rounded-full border bg-white/5 text-white/40 border-white/10 font-medium">
                      ● Archived
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold font-heading leading-tight">{opp.title}</h1>
              </div>
              <button
                onClick={handleShare}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition flex items-center gap-1 flex-shrink-0 backdrop-blur-sm"
              >
                {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Share2 className="w-3 h-3" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-sm text-white/60 mb-6">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#5CE3B6]" />
                {opp.organizer}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#5CE3B6]" />
                Deadline: {new Date(opp.deadline).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </div>
              {opp.isAnnual && (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F2F8C9]" />
                  Annual
                </div>
              )}
            </div>

            {/* Countdown callout */}
            {!isArchived && (
              <div className="bg-gradient-to-r from-[#5CE3B6]/10 to-[#3352CD]/10 border border-[#5CE3B6]/20 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Clock className="w-4 h-4 text-[#5CE3B6]" />
                  <span className="font-medium">Time Remaining</span>
                </div>
                <CountdownTimer targetDate={opp.deadline} />
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-bold font-heading mb-3 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-[#5CE3B6]" /> About This Opportunity
              </h2>
              <div className="max-w-none">
                <MarkdownRenderer content={opp.description} />
              </div>
            </div>

            {/* Required Skills */}
            {opp.requiredSkills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold font-heading mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#5CE3B6]" /> Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {opp.requiredSkills.map((s) => (
                    <span key={s} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-sm text-white/70">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {opp.benefits.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold font-heading mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#F2F8C9]" /> Benefits
                </h2>
                <div className="space-y-2">
                  {opp.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-white/70">
                      <CheckCircle className="w-4 h-4 text-[#5CE3B6] mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact person */}
            {(opp.cpName || opp.cpContact) && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
                <h2 className="text-sm font-bold font-heading mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#5CE3B6]" /> Contact Person
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-white/70">
                  {opp.cpName && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-white/40" />
                      {opp.cpName}
                    </div>
                  )}
                  {opp.cpContact && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-white/40" />
                      {opp.cpContact}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {opp.link && !isArchived && (
                <a
                  href={opp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[200px] bg-gradient-to-r from-[#3352CD] to-[#5CE3B6] hover:from-[#4a6cf7] hover:to-[#7ff0cc] transition px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-[#3352CD]/30"
                >
                  <ExternalLink className="w-4 h-4" /> Apply Now
                </a>
              )}
              <button
                onClick={handleShare}
                className="flex-1 min-w-[200px] bg-white/5 hover:bg-white/10 border border-white/10 transition px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                {copied ? "Link Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}