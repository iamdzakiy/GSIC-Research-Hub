"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getOpportunities } from "@/services/opportunities";
import { Opportunity } from "@/lib/types";
import Navbar from "@/components/Navbar";
import { Calendar, User, Link as LinkIcon, Tag, CheckCircle, Share2, Copy, Check } from "lucide-react";

export default function OpportunityDetail() {
  const { id } = useParams();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      getOpportunities().then(opps => {
        const found = opps.find(o => o.id === id || o.slug === id);
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

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  if (!opp) return <div className="text-white text-center mt-20">Opportunity not found</div>;

  return (
    <div className="min-h-screen bg-hero-gradient font-body pt-20 mesh-gradient">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 glow-border">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold font-heading gradient-text">{opp.title}</h1>
            <button onClick={handleShare} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition flex items-center gap-1 flex-shrink-0">
              {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Share2 className="w-3 h-3" />}
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/60">
            <div className="flex items-center gap-1"><Tag className="w-4 h-4" /> {opp.type}</div>
            <div className="flex items-center gap-1"><User className="w-4 h-4" /> {opp.organizer}</div>
            <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Deadline: {new Date(opp.deadline).toLocaleDateString()}</div>
          </div>
          <p className="mt-6 text-white/70 leading-relaxed">{opp.description}</p>
          {opp.requiredSkills.length > 0 && (
            <div className="mt-4">
              <strong className="text-white/60">Required Skills:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {opp.requiredSkills.map(s => <span key={s} className="bg-white/10 px-2 py-1 rounded-full text-xs">{s}</span>)}
              </div>
            </div>
          )}
          {opp.benefits.length > 0 && (
            <div className="mt-4">
              <strong className="text-white/60">Benefits:</strong>
              <ul className="list-disc list-inside mt-1 text-white/70">
                {opp.benefits.map(b => <li key={b}>{b}</li>)}
              </ul>
            </div>
          )}
          {opp.link && (
            <a href={opp.link} target="_blank" rel="noopener" className="inline-block mt-6 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] px-6 py-2 rounded-full hover:from-[#3B82F6] hover:to-[#22D3EE] transition">
              Apply Now
            </a>
          )}
          {opp.cpName && (
            <div className="mt-6 text-sm text-white/40">Contact: {opp.cpName} ({opp.cpContact})</div>
          )}
        </motion.div>
      </main>
    </div>
  );
}