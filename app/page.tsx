"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  GraduationCap,
  Sparkles,
  Globe,
  Award,
  BookOpen,
  Calendar,
  ExternalLink,
  Users,
  Zap,
  AlertCircle,
  Rocket,
  Heart,
  Shield,
  User,
  Search,
  Layers,
  Mail,
  Link2,
  X,
  ArrowRight,
  Microscope,
  FlaskConical,
  Play,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Navbar from "@/components/Navbar";
import {
  SEED_OPPORTUNITIES,
  SEED_CURATED,
  SEED_EVENTS,
  formatDate,
  daysUntil,
  getTypeIcon,
  getTypeLabel,
  getEventStatusColor,
  getEventStatusText,
} from "@/lib/data";
import { getOpportunities, updateOpportunity } from "@/services/opportunities";
import { getCurated } from "@/services/curated";
import { getEvents } from "@/services/events";
import { getSpeakers } from "@/services/speakers";
import { Opportunity, CuratedOpportunity, GSICEvent, Speaker } from "@/lib/types";
import OpportunityCard from "@/components/OpportunityCard";
import VideoModal from "@/components/VideoModal";

// Teaser video URL (YouTube or Instagram). Update this to your actual teaser link.
const TEASER_VIDEO_URL = process.env.NEXT_PUBLIC_TEASER_VIDEO_URL || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

export default function HomePage() {
  const { user, userProfile, loading, isAdmin } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [curated, setCurated] = useState<CuratedOpportunity[]>([]);
  const [events, setEvents] = useState<GSICEvent[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"deadline" | "title" | "type" | "organizer">("deadline");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [opps, curatedList, eventsList, speakersList] = await Promise.all([
        getOpportunities(),
        getCurated(),
        getEvents(),
        getSpeakers(),
      ]);

      // Auto-archive expired opportunities
      const now = new Date();
      const updated = opps.map(o => {
        if (new Date(o.deadline) < now && o.status !== "archived") {
          updateOpportunity(o.id, { status: "archived" }).catch(console.error);
          return { ...o, status: "archived" as const };
        }
        return o;
      });

      setOpportunities(updated);
      setCurated(curatedList);
      setEvents(eventsList);
      setSpeakers(speakersList);
    } catch (e) {
      console.error("API load error:", e);
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = opportunities.filter(o => {
    if (!showArchived && o.status === "archived") return false;
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    // Archived always pushed to bottom
    const aArch = a.status === "archived" ? 1 : 0;
    const bArch = b.status === "archived" ? 1 : 0;
    if (aArch !== bArch) return aArch - bArch;

    let cmp = 0;
    if (sortBy === "deadline") cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    else if (sortBy === "title") cmp = a.title.localeCompare(b.title);
    else if (sortBy === "type") cmp = a.type.localeCompare(b.type);
    else if (sortBy === "organizer") cmp = a.organizer.localeCompare(b.organizer);
    return sortDir === "asc" ? cmp : -cmp;
  });
  const activeOpps = sorted;
  const pkmBootcamp = events.find((e) => e.type === "bootcamp");
  const sandboxEvent = events.find((e) => e.type === "sandbox");
  const activeSpeakers = speakers.filter(s => s.isActive).sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <div className="text-center">
          <img 
              src="/favicon.png" 
              alt="Logo" 
              className="w-16 h-16 mx-auto mb-4 animate-pulse object-contain"
            />
          <div className="text-white/60 font-body">Loading GSIC Hub...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient font-body">
      <Navbar />

      <div className="fixed w-[600px] h-[600px] rounded-full bg-[#3352CD] opacity-[0.08] blur-[100px] pointer-events-none -top-[250px] -left-[250px] animate-float-blob z-0" />
      <div className="fixed w-[450px] h-[450px] rounded-full bg-[#5CE3B6] opacity-[0.08] blur-[100px] pointer-events-none -bottom-[200px] -right-[200px] animate-float-blob z-0" style={{ animationDelay: "8s" }} />
      <div className="fixed w-[350px] h-[350px] rounded-full bg-[#F2F8C9] opacity-[0.06] blur-[100px] pointer-events-none top-[40%] right-[10%] animate-float-blob z-0" style={{ animationDelay: "16s" }} />

      <main className="pt-20 pb-12 relative z-10">
        <section id="home" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8 md:p-12 text-center backdrop-blur-2xl">
            <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full text-xs text-white/50 mb-6 border border-white/5">
              <span className="w-2 h-2 rounded-full bg-[#5CE3B6] animate-pulse" />
              GSIC-Research-Hub · Innovation Ecosystem
            </div>
            <h1 className="text-4xl md:text-7xl font-extrabold leading-tight font-heading">
              <span className="gradient-text">GSIC-Research-Hub</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed font-body">
              The central ecosystem for{" "}
              <span className="text-[#5CE3B6] font-semibold">opportunities</span>,{" "}
              <span className="text-[#F2F8C9] font-semibold">research</span>, and{" "}
              <span className="text-[#3352CD] font-semibold">innovation</span>
              at <span className="text-white/80">KM ITB</span>.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="#opportunities" className="px-6 py-3 rounded-full bg-[#3352CD] hover:bg-[#4a6cf7] transition font-medium shadow-lg shadow-[#3352CD]/30 flex items-center gap-2">
                <Target className="w-4 h-4" /> Explore Opportunities
              </a>
              <a href="#events" className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 transition border border-white/10 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Events
              </a>
              <a href="#about" className="px-6 py-3 rounded-full bg-[#5CE3B6]/10 hover:bg-[#5CE3B6]/20 transition border border-[#5CE3B6]/20 flex items-center gap-2 text-[#5CE3B6]">
                <Globe className="w-4 h-4" /> About GSIC
              </a>
              <button
                onClick={() => setVideoModalOpen(true)}
                className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 transition border border-white/10 flex items-center gap-2 group"
              >
                <span className="relative flex items-center justify-center w-5 h-5">
                  <span className="absolute inset-0 rounded-full bg-[#5CE3B6]/30 animate-ping group-hover:bg-[#5CE3B6]/50" />
                  <Play className="relative w-3.5 h-3.5 text-[#5CE3B6] fill-current ml-0.5" />
                </span>
                Watch Teaser
              </button>
            </div>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {[
                { label: "Active Opps", value: activeOpps.filter(o => o.status !== "archived").length, color: "text-[#5CE3B6]" },
                { label: "Curated", value: curated.length, color: "text-[#F2F8C9]" },
                { label: "Events", value: events.length, color: "text-[#3352CD]" },
                { label: "Bootcamp", value: pkmBootcamp ? 1 : 0, color: "text-[#5CE3B6]" },
                { label: "Sandbox", value: sandboxEvent ? 1 : 0, color: "text-[#F2F8C9]" },
              ].map((stat) => (
                <div key={stat.label} className={`bg-white/5 rounded-xl p-3 md:p-4 backdrop-blur-sm border border-white/5`}>
                  <div className={`text-2xl md:text-3xl font-bold font-heading ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* SPEAKERS SECTION */}
        <section id="speakers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-2">
            <Users className="w-7 h-7 text-[#8B5CF6]" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading">Featured Speakers</h2>
          </motion.div>
          <p className="text-sm text-white/40 mb-6 font-body">World-class researchers, mentors, and industry leaders</p>

          {activeSpeakers.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-[#06B6D4]/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-[#A78BFA]" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-2">Curating World-Class Speakers</h3>
              <p className="text-white/50 max-w-md mx-auto">We're curating world-class speakers and mentors. Stay tuned for exciting announcements!</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSpeakers.map((speaker, idx) => (
                <motion.div
                  key={speaker.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass rounded-2xl p-6 card-hover glow-border"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white font-bold text-xl overflow-hidden flex-shrink-0">
                      {speaker.avatarUrl ? (
                        <img src={speaker.avatarUrl} alt={speaker.name} className="w-full h-full object-cover" />
                      ) : (
                        speaker.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold font-heading truncate">{speaker.name}</h3>
                      <div className="text-xs text-[#A78BFA] font-medium">{speaker.roleTitle}</div>
                      <div className="text-xs text-white/40 mt-0.5">{speaker.institution}</div>
                    </div>
                  </div>
                  {speaker.bio && (
                    <p className="text-xs text-white/50 mt-4 line-clamp-3">{speaker.bio}</p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSpeaker(speaker)}
                      className="text-xs bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#A78BFA] px-3 py-1.5 rounded-full transition flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" /> View Bio
                    </button>
                    {speaker.linkedinUrl && (
                      <a href={speaker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> LinkedIn
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section id="events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-7 h-7 text-[#5CE3B6]" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading">GSIC Events</h2>
          </div>
          <p className="text-sm text-white/40 mb-6 font-body">PKM-Bootcamp and The Sandbox — each with their own approach to learning</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {pkmBootcamp && (
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-6 md:p-8 card-hover border-t-4 border-[#3352CD]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3352CD]/30 to-[#5CE3B6]/30 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-[#5CE3B6]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading">{pkmBootcamp.title}</h3>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getEventStatusColor(pkmBootcamp.status)}`}>{getEventStatusText(pkmBootcamp.status)}</span>
                      {pkmBootcamp.hasPreTest && (
                        <span className="text-xs bg-[#3352CD]/20 text-[#3352CD] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Award className="w-3 h-3" /> Pre/Post Test
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/60 font-body leading-relaxed mb-4 line-clamp-3">{pkmBootcamp.description}</p>
                <div className="grid grid-cols-2 gap-3 text-xs text-white/40 mb-4">
                  <div>📅 {formatDate(pkmBootcamp.startDate)}</div>
                  <div>📍 {pkmBootcamp.location}</div>
                  <div>👥 {pkmBootcamp.currentParticipants}/{pkmBootcamp.maxParticipants}</div>
                  <div>⏱️ {pkmBootcamp.modules.length} modules</div>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-white/40 mb-1">Pre/Post Test Info</div>
                  <div className="text-xs text-white/50 font-body">{pkmBootcamp.preTestExplanation?.substring(0, 120) || ""}...</div>
                </div>
                <a href="/events/pkm-bootcamp" className="w-full bg-gradient-to-r from-[#3352CD] to-[#4a6cf7] hover:from-[#4a6cf7] hover:to-[#5a7cff] transition py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                  <Rocket className="w-4 h-4" /> View PKM Bootcamp
                </a>
              </motion.div>
            )}
            {sandboxEvent && (
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-6 md:p-8 card-hover border-t-4 border-[#5CE3B6]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5CE3B6]/30 to-[#F2F8C9]/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#3352CD]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading">{sandboxEvent.title}</h3>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getEventStatusColor(sandboxEvent.status)}`}>{getEventStatusText(sandboxEvent.status)}</span>
                      {!sandboxEvent.hasPreTest && !sandboxEvent.hasPostTest && (
                        <span className="text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> No Assessments
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/60 font-body leading-relaxed mb-4 line-clamp-3">{sandboxEvent.description}</p>
                <div className="grid grid-cols-2 gap-3 text-xs text-white/40 mb-4">
                  <div>📅 {formatDate(sandboxEvent.startDate)}</div>
                  <div>📍 {sandboxEvent.location}</div>
                  <div>👥 {sandboxEvent.currentParticipants}/{sandboxEvent.maxParticipants}</div>
                  <div>⏱️ {sandboxEvent.modules.length} modules</div>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-white/40 mb-1">Assessment Policy</div>
                  <div className="text-xs text-white/50 font-body">No pre-test or post-test. Focus on hands-on collaboration and rapid prototyping.</div>
                </div>
                <a href="/events/sandbox" className="w-full bg-gradient-to-r from-[#5CE3B6] to-[#3ab88a] hover:from-[#3ab88a] hover:to-[#5CE3B6] transition py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> View The Sandbox
                </a>
              </motion.div>
            )}
          </div>
        </section>

        <section id="opportunities" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3 font-heading">
                <Target className="w-7 h-7 text-[#5CE3B6]" /> Opportunities Corner
              </h2>
              <p className="text-sm text-white/40 mt-1 font-body">Research, Scholarships, Careers & Competitions</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-white/40">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-[#5CE3B6]" />
              Show archived
            </label>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {[
              { id: "all", label: "All", icon: "✨" },
              { id: "research", label: "Research", icon: "🔬" },
              { id: "scholarship", label: "Scholarship", icon: "🎓" },
              { id: "career", label: "Career", icon: "💼" },
              { id: "competition", label: "Competition", icon: "🏆" },
            ].map((f) => (
              <motion.button
                key={f.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTypeFilter(f.id)}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition font-medium ${
                  typeFilter === f.id
                    ? "bg-[#3352CD] border-[#3352CD] text-white shadow-lg shadow-[#3352CD]/30"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10"
                }`}
              >
                {f.icon} {f.label}
              </motion.button>
            ))}

            {/* Sort controls */}
            <div className="ml-auto flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white/70 focus:outline-none focus:border-[#5CE3B6] cursor-pointer"
              >
                <option value="deadline">Sort: Deadline</option>
                <option value="title">Sort: Title (A-Z)</option>
                <option value="type">Sort: Category</option>
                <option value="organizer">Sort: Organizer</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white/70 hover:bg-white/10 transition"
                title={sortDir === "asc" ? "Ascending" : "Descending"}
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOpps.length === 0 ? (
              <div className="col-span-full text-center py-12 text-white/30">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" /> No opportunities found.
              </div>
            ) : (
              activeOpps.map((opp, idx) => (
                <OpportunityCard
                  key={opp.id}
                  opp={opp}
                  index={idx}
                  onExpire={(id) => {
                    setOpportunities((prev) =>
                      prev.map((o) => (o.id === id ? { ...o, status: "archived" as const } : o))
                    );
                    updateOpportunity(id, { status: "archived" }).catch(console.error);
                  }}
                />
              ))
            )}
          </div>
        </section>

        <section id="curated" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-7 h-7 text-[#F2F8C9]" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading">Curated Opportunities</h2>
          </div>
          <p className="text-sm text-white/40 mb-6 font-body">Annual/recurring opportunities — prepare in advance.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curated.length === 0 ? (
              <div className="col-span-full text-center py-12 text-white/30">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" /> No curated opportunities yet.
              </div>
            ) : (
              curated.map((c, idx) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} className="glass rounded-2xl p-5 card-hover border-t-4 border-[#F2F8C9]">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full">{getTypeLabel(c.type)}</span>
                    <span className="text-xs text-[#F2F8C9] font-medium">📅 Opens {c.monthOpen}</span>
                  </div>
                  <h3 className="text-base font-bold font-heading">{c.title}</h3>
                  <div className="text-xs text-white/40 mt-1">{c.organizer}</div>
                  <p className="text-xs text-white/50 mt-2">{c.description}</p>
                  <div className="mt-3">
                    {c.link && (
                      <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-xs bg-[#3352CD]/30 hover:bg-[#3352CD]/50 px-3 py-1 rounded-full transition flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Prepare
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-8 font-heading">
            <AlertCircle className="w-7 h-7 text-[#5CE3B6]" /> About GSIC-Research-Hub
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 mb-10">
            <p className="text-lg text-white/70 leading-relaxed font-body">
              <span className="font-bold text-white">GSIC-Research-Hub</span> is the research-focused digital ecosystem of the Ganesha Students Innovation Center at KM ITB. It centralizes research opportunities, scholarships, competitions, and collaboration tools for students and admins.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Globe className="w-6 h-6 text-[#5CE3B6]" />, title: "Connection", desc: "Centralizes research, competitions, publications. Bridges students with opportunities and teammates.", color: "border-t-4 border-[#5CE3B6]" },
              { icon: <GraduationCap className="w-6 h-6 text-[#F2F8C9]" />, title: "PKM Bootcamp", desc: "Structured cohort-based training for research and innovation. From ideation to competitive proposals.", color: "border-t-4 border-[#F2F8C9]" },
              { icon: <Zap className="w-6 h-6 text-[#3352CD]" />, title: "Sandbox", desc: "Interdisciplinary co-creation space. Cross-pollination of ideas across majors and fields.", color: "border-t-4 border-[#3352CD]" },
            ].map((pillar, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className={`glass rounded-2xl p-6 card-hover ${pillar.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  {pillar.icon}
                  <h3 className="text-lg font-bold font-heading">{pillar.title}</h3>
                </div>
                <p className="text-sm text-white/60 font-body">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-12 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center text-white font-bold text-xs">G</div>
                <span className="font-bold gradient-text font-heading">GSIC-Research-Hub</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed font-body">
                Ganesha Students Innovation Center · KM ITB
                <br />
                Empowering student research since 2024
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-white/60 mb-3 font-heading">Quick Links</div>
              <div className="space-y-1.5 text-sm text-white/40 font-body">
                <a href="#opportunities" className="block hover:text-[#5CE3B6] transition">🎯 Opportunities</a>
                <a href="#events" className="block hover:text-[#5CE3B6] transition">🎓 Events</a>
                <a href="#curated" className="block hover:text-[#5CE3B6] transition">📅 Curated</a>
                <a href="#about" className="block hover:text-[#5CE3B6] transition">🌐 About GSIC</a>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white/60 mb-3 font-heading">Contact</div>
              <div className="space-y-1.5 text-sm text-white/40 font-body">
                <div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-[#5CE3B6]" /> gsic@ganesha.edu</div>
                <div className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-[#5CE3B6]" /> +62 812-3456-7890</div>
                <div className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-[#5CE3B6]" /> KM ITB Campus</div>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-white/20 border-t border-white/5 pt-6 font-body">
            <p>© 2026 GSIC-Research-Hub · Ganesha Students Innovation Center · Built with <Heart className="w-3 h-3 inline text-[#5CE3B6]" /> for the student community</p>
          </div>
        </footer>
      </main>

      {/* Speaker Bio Modal */}
      <AnimatePresence>
        {selectedSpeaker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedSpeaker(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                    {selectedSpeaker.avatarUrl ? (
                      <img src={selectedSpeaker.avatarUrl} alt={selectedSpeaker.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedSpeaker.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold font-heading">{selectedSpeaker.name}</h3>
                    <div className="text-xs text-[#A78BFA]">{selectedSpeaker.roleTitle}</div>
                    <div className="text-xs text-white/40">{selectedSpeaker.institution}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedSpeaker(null)} className="text-white/40 hover:text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedSpeaker.bio && (
                <p className="text-sm text-white/60 leading-relaxed">{selectedSpeaker.bio}</p>
              )}
              {selectedSpeaker.linkedinUrl && (
                <a href={selectedSpeaker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs text-[#A78BFA] hover:underline">
                  <Link2 className="w-3 h-3" /> Connect on LinkedIn
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3.5 rounded-2xl glass border ${toast.type === "success" ? "border-[#5CE3B6]" : "border-red-400"} text-white font-medium z-50 shadow-2xl backdrop-blur-xl flex items-center gap-2`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.msg}
        </div>
      )}

      {/* Teaser Video Modal */}
      <VideoModal
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={TEASER_VIDEO_URL}
        title="GSIC Research Hub — Teaser"
      />
    </div>
  );
}
