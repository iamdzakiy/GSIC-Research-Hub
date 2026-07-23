"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Calendar,
  Target,
  BookOpen,
  FileText,
  Award,
  CheckCircle,
  BarChart3,
  Rocket,
  Plus,
  AlertCircle,
  ExternalLink,
  Users,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Navbar from "@/components/Navbar";
import {
  SEED_OPPORTUNITIES,
  SEED_EVENTS,
  SEED_TESTS,
  SEED_DOCUMENTS,
  formatDate,
  getTypeIcon,
  getTypeLabel,
  getCategoryIcon,
  getCategoryLabel,
  generateId,
} from "@/lib/data";
import {
  GSICEvent,
  Test,
  TestResult,
  Registration,
  Opportunity,
  Document,
} from "@/lib/types";
import {
  getOpportunities,
  getEvents,
  getTests,
  getRegistrations,
  getTestResults,
  getDocuments,
  ensureSeed,
} from "@/lib/firestore";

export default function DashboardPage() {
  const { user, userProfile, loading, isAdmin } = useAuth();

  const [events, setEvents] = useState<GSICEvent[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  const [activeTab, setActiveTab] = useState("tabOverview");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await ensureSeed("opportunities", SEED_OPPORTUNITIES);
      await ensureSeed("events", SEED_EVENTS);
      await ensureSeed("tests", SEED_TESTS);
      await ensureSeed("documents", SEED_DOCUMENTS);
      const [eventsList, testsList, regsList, resultsList, oppsList, docsList] = await Promise.all([
        getEvents(),
        getTests(),
        getRegistrations(),
        getTestResults(),
        getOpportunities(),
        getDocuments(),
      ]);
      setEvents(eventsList as GSICEvent[]);
      setTests(testsList as Test[]);
      setRegistrations(regsList as Registration[]);
      setTestResults(resultsList as TestResult[]);
      setOpportunities(oppsList as Opportunity[]);
      setDocuments(docsList as Document[]);
    } catch (e) {
      console.error("Firestore load error:", e);
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const userRegistrations = user
    ? registrations.filter((r) => r.userId === user.uid)
    : [];

  const userEvents = userRegistrations
    .map((reg) => events.find((e) => e.id === reg.eventId))
    .filter(Boolean) as GSICEvent[];

  const userTestResults = user
    ? testResults.filter((r) => r.userId === user.uid)
    : [];

  const averageScore =
    userTestResults.length > 0
      ? Math.round(
          userTestResults.reduce((sum, r) => sum + (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0), 0) / userTestResults.length
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse">
            G
          </div>
          <div className="text-white/60 font-body">Loading GSIC Hub...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-hero-gradient font-body pt-20">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <User className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-white/60 mb-6">Please sign in to access your dashboard.</p>
          <a href="/auth" className="inline-block bg-gradient-to-r from-[#3352CD] to-[#4a6cf7] hover:from-[#4a6cf7] hover:to-[#5a7cff] transition px-6 py-2.5 rounded-full font-medium">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient font-body pt-20">
      <Navbar />

      <div className="fixed w-[500px] h-[500px] rounded-full bg-[#3352CD] opacity-[0.06] blur-[100px] pointer-events-none -top-[200px] -left-[200px] animate-float-blob z-0"></div>
      <div className="fixed w-[400px] h-[400px] rounded-full bg-[#5CE3B6] opacity-[0.06] blur-[100px] pointer-events-none -bottom-[150px] -right-[150px] animate-float-blob z-0" style={{ animationDelay: "8s" }}></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center text-white font-bold text-xl">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
              ) : (
                (userProfile?.name || user.email || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading"><span className="gradient-text">My Dashboard</span></h1>
              <p className="text-sm text-white/40 font-body">{userProfile?.name || "Welcome"} · {userProfile?.major || "Set your major in profile"}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Registered Events", value: userEvents.length, color: "text-[#5CE3B6]", icon: <Calendar className="w-5 h-5 text-[#5CE3B6]" /> },
            { label: "Tests Taken", value: userTestResults.length, color: "text-[#3352CD]", icon: <Award className="w-5 h-5 text-[#3352CD]" /> },
            { label: "Avg. Score", value: `${averageScore}%`, color: "text-[#F2F8C9]", icon: <TrendingUp className="w-5 h-5 text-[#F2F8C9]" /> },
            { label: "Opportunities", value: opportunities.filter((o) => o.status === "active").length, color: "text-[#5CE3B6]", icon: <Target className="w-5 h-5 text-[#5CE3B6]" /> },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>{stat.icon}</div>
              <div>
                <div className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-1 mb-6 border-b border-white/5 pb-4 text-sm">
          {[
            { id: "tabOverview", label: "📊 Overview" },
            { id: "tabEvents", label: "🎓 My Events" },
            { id: "tabOpportunities", label: "🎯 Opportunities" },
            { id: "tabDocuments", label: "📄 Documents" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1.5 rounded-lg transition ${activeTab === tab.id ? "bg-[#3352CD]/30 border border-[#3352CD]/40 font-medium" : "hover:bg-white/5"}`}>
              {tab.label}
            </button>
          ))}
        </motion.div>

        {activeTab === "tabOverview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 font-heading"><BarChart3 className="w-5 h-5 text-[#5CE3B6]" /> Test Results</h3>
              {userTestResults.length === 0 ? (
                <div className="text-center py-8 text-white/30"><Award className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>You haven't taken any tests yet.</p></div>
              ) : (
                <div className="space-y-4">
                  {userTestResults.map((result) => {
                    const test = tests.find((t) => t.id === result.testId);
                    if (!test) return null;
                    const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
                    return (
                      <div key={result.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium flex items-center gap-2">{test.type === "pre" ? <Award className="w-4 h-4 text-[#3352CD]" /> : <CheckCircle className="w-4 h-4 text-[#5CE3B6]" />}{test.title}</div>
                          <div className="text-xs text-white/40 mt-1">{formatDate(result.completedAt)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold font-heading">{result.score}/{result.maxScore}</div>
                          <div className="text-xs text-white/40">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 font-heading"><Calendar className="w-5 h-5 text-[#5CE3B6]" /> My Events</h3>
              {userEvents.length === 0 ? (
                <div className="text-center py-8 text-white/30"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>You haven't registered for any events yet.</p></div>
              ) : (
                <div className="space-y-3">
                  {userEvents.map((evt) => {
                    const reg = userRegistrations.find((r) => r.eventId === evt.id);
                    return (
                      <div key={evt.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3352CD]/30 to-[#5CE3B6]/30 flex items-center justify-center flex-shrink-0"><Award className="w-5 h-5 text-[#5CE3B6]" /></div>
                          <div className="truncate">
                            <div className="font-medium">{evt.title}</div>
                            <div className="text-xs text-white/40">{evt.type === "bootcamp" ? "Bootcamp" : "Sandbox"} · {reg?.status || "confirmed"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {evt.hasPreTest && <span className={`text-xs ${reg?.preTestCompleted ? "text-[#5CE3B6]" : "text-white/40"}`}>{reg?.preTestCompleted ? "✅ Pre" : "— Pre"}</span>}
                          {evt.hasPostTest && <span className={`text-xs ${reg?.postTestCompleted ? "text-[#5CE3B6]" : "text-white/40"}`}>{reg?.postTestCompleted ? "✅ Post" : "— Post"}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "tabEvents" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {userEvents.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Events Yet</h3>
                <p className="text-white/60 mb-6">Browse and register below!</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="/events/pkm-bootcamp" className="px-6 py-2.5 rounded-full bg-[#3352CD] hover:bg-[#4a6cf7] transition font-medium flex items-center justify-center gap-2"><Award className="w-4 h-4" /> PKM Bootcamp</a>
                  <a href="/events/sandbox" className="px-6 py-2.5 rounded-full bg-[#5CE3B6]/20 text-[#5CE3B6] hover:bg-[#5CE3B6]/30 transition border border-[#5CE3B6]/30 flex items-center justify-center gap-2"><Award className="w-4 h-4" /> The Sandbox</a>
                </div>
              </div>
            ) : (
              userEvents.map((evt) => {
                const reg = userRegistrations.find((r) => r.eventId === evt.id);
                return (
                  <div key={evt.id} className="glass rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3352CD]/30 to-[#5CE3B6]/30 flex items-center justify-center"><Award className="w-5 h-5 text-[#5CE3B6]" /></div>
                        <div>
                          <h4 className="font-bold font-heading">{evt.title}</h4>
                          <div className="text-xs text-white/40">{evt.type === "bootcamp" ? "Bootcamp" : "Sandbox"} · {formatDate(evt.startDate)} - {formatDate(evt.endDate)}</div>
                        </div>
                      </div>
                      <a href={`/events/${evt.type === "bootcamp" ? "pkm-bootcamp" : "sandbox"}`} className="text-xs text-[#5CE3B6] hover:underline flex items-center gap-1">View Event <ExternalLink className="w-3.5 h-3.5" /></a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="text-xs text-white/40">Status</div>
                        <div className="font-medium text-[#5CE3B6]">{reg?.status === "confirmed" ? "✅ Confirmed" : reg?.status}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="text-xs text-white/40">Pre-Test</div>
                        <div className="font-medium flex items-center gap-1">{evt.hasPreTest ? (reg?.preTestCompleted ? <span className="text-[#5CE3B6]">✅ Completed</span> : <span className="text-white/40">Available</span>) : <span className="text-white/40">Not available</span>}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="text-xs text-white/40">Post-Test</div>
                        <div className="font-medium flex items-center gap-1">{evt.hasPostTest ? (reg?.postTestCompleted ? <span className="text-[#5CE3B6]">✅ Completed</span> : <span className="text-white/40">Not available</span>) : <span className="text-white/40">Not available</span>}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {activeTab === "tabOpportunities" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-heading">Active Opportunities</h3>
              <div className="text-xs text-white/40">{opportunities.filter((o) => o.status === "active").length} active</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {opportunities.filter((o) => o.status === "active").map((opp) => (
                <div key={opp.id} className="glass rounded-2xl p-5 card-hover border-l-4 border-[#5CE3B6]">
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-block text-[10px] bg-white/10 px-2.5 py-1 rounded-full">{getTypeLabel(opp.type)}</span>
                  </div>
                  <h4 className="text-base font-bold leading-snug font-heading">{opp.title}</h4>
                  <div className="text-xs text-white/40 mt-1">{opp.organizer}</div>
                  <p className="text-xs text-white/50 mt-2 line-clamp-2">{opp.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {opp.link && (
                      <a href={opp.link} target="_blank" rel="noopener noreferrer" className="text-xs bg-[#3352CD]/30 hover:bg-[#3352CD]/50 px-3 py-1 rounded-full transition flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Apply
                      </a>
                    )}
                    {opp.requiredSkills && opp.requiredSkills.length > 0 && <div className="text-xs text-white/30">Skills: {opp.requiredSkills.join(", ")}</div>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "tabDocuments" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-heading">Documents & Resources</h3>
              <div className="text-xs text-white/40">{documents.length} documents</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {documents.length === 0 ? (
                <div className="col-span-full text-center py-12 text-white/30"><FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />No documents yet.</div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="glass rounded-2xl p-5 card-hover">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3352CD]/30 to-[#5CE3B6]/30 flex items-center justify-center flex-shrink-0"><span className="text-lg">{getCategoryIcon(doc.type)}</span></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate font-heading">{doc.title}</h4>
                        <div className="text-xs text-white/40 mt-0.5">{doc.author || "Anonymous"} · {getCategoryLabel(doc.type)}</div>
                        <div className="mt-2">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-[#3352CD]/30 hover:bg-[#3352CD]/50 px-3 py-1 rounded-full transition inline-flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Open
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </main>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3.5 rounded-2xl glass border ${toast.type === "success" ? "border-[#5CE3B6]" : "border-red-400"} text-white font-medium z-50 shadow-2xl backdrop-blur-xl flex items-center gap-2`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}