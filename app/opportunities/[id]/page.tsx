"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getOpportunities } from "@/services/opportunities";
import { Opportunity } from "@/lib/types";
import Navbar from "@/components/Navbar";
import { Calendar, User, Link as LinkIcon, Tag, CheckCircle } from "lucide-react";

export default function OpportunityDetail() {
  const { id } = useParams();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getOpportunities().then(opps => {
        const found = opps.find(o => o.id === id);
        setOpp(found || null);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  if (!opp) return <div className="text-white text-center mt-20">Opportunity not found</div>;

  return (
    <div className="min-h-screen bg-hero-gradient font-body pt-20">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8">
          <h1 className="text-3xl font-bold font-heading gradient-text">{opp.title}</h1>
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
            <a href={opp.link} target="_blank" rel="noopener" className="inline-block mt-6 bg-[#3352CD] px-6 py-2 rounded-full hover:bg-[#4a6cf7] transition">
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