"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Plus,
  Trash2,
  Archive,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Target,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Edit,
  Copy,
  Mail,
  BarChart3,
  Award,
  Settings,
  Layers,
  GraduationCap,
  Sparkles,
  Search,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Navbar from "@/components/Navbar";
import {
  SEED_OPPORTUNITIES,
  SEED_CURATED,
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
  Opportunity,
  CuratedOpportunity,
  GSICEvent,
  Test,
  AdminAccount,
  Document,
} from "@/lib/types";
import {
  getOpportunities,
  getEvents,
  getTests,
  getDocuments,
  getAdminAccounts,
  ensureSeed,
  create,
  update,
  remove,
} from "@/lib/firestore";

export default function AdminDashboard() {
  const { user, userProfile, loading, isAdmin } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [curated, setCurated] = useState<CuratedOpportunity[]>([]);
  const [events, setEvents] = useState<GSICEvent[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);

  const [activeTab, setActiveTab] = useState("tabEvents");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Form states
  const [eventForm, setEventForm] = useState({
    title: "",
    type: "bootcamp" as "bootcamp" | "sandbox",
    description: "",
    shortDescription: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    location: "",
    maxParticipants: 50,
    hasPreTest: false,
    hasPostTest: false,
    preTestExplanation: "",
    postTestExplanation: "",
  });

  const [adminForm, setAdminForm] = useState({
    email: "",
    name: "",
  });

  const [opportunitySearch, setOpportunitySearch] = useState("");
  const [opportunitySort, setOpportunitySort] = useState<"deadline" | "title" | "status">("deadline");
  const [opportunityDir, setOpportunityDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await ensureSeed("opportunities", SEED_OPPORTUNITIES);
      await ensureSeed("events", SEED_EVENTS);
      await ensureSeed("tests", SEED_TESTS);
      await ensureSeed("documents", SEED_DOCUMENTS);
      const [opps, eventsList, testsList, docsList, admins] = await Promise.all([
        getOpportunities(),
        getEvents(),
        getTests(),
        getDocuments(),
        getAdminAccounts(),
      ]);
      setOpportunities(opps as Opportunity[]);
      setEvents(eventsList as GSICEvent[]);
      setTests(testsList as Test[]);
      setDocuments(docsList as Document[]);
      setAdminAccounts(admins as AdminAccount[]);
    } catch (e) {
      console.error("Firestore load error:", e);
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.description) {
      showToast("Title and description are required.", "error");
      return;
    }
    const id = `event-${generateId()}`;
    const newEvent: GSICEvent = {
      id,
      type: eventForm.type,
      title: eventForm.title,
      description: eventForm.description,
      shortDescription: eventForm.shortDescription || eventForm.description.substring(0, 100),
      startDate: eventForm.startDate,
      endDate: eventForm.endDate,
      registrationDeadline: eventForm.registrationDeadline,
      location: eventForm.location,
      maxParticipants: eventForm.maxParticipants,
      currentParticipants: 0,
      status: "upcoming",
      clusters: [],
      modules: [],
      speakers: [],
      hasPreTest: eventForm.hasPreTest,
      hasPostTest: eventForm.hasPostTest,
      preTestId: eventForm.hasPreTest ? `test-${generateId()}` : undefined,
      postTestId: eventForm.hasPostTest ? `test-${generateId()}` : undefined,
      preTestExplanation: eventForm.preTestExplanation,
      postTestExplanation: eventForm.postTestExplanation,
      createdBy: user?.uid || "unknown",
      createdAt: new Date().toISOString(),
    };
    try {
      await create("events", newEvent);
      setEvents([...events, newEvent]);
      showToast(`✅ Event "${newEvent.title}" created!`);
    } catch (e) {
      console.error(e);
      showToast("Failed to create event", "error");
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event? This will also delete associated tests.")) return;
    try {
      await remove("events", id);
      setEvents(events.filter((e) => e.id !== id));
      showToast("🗑️ Event deleted.");
    } catch (e) {
      showToast("Failed to delete event", "error");
    }
  };

  const handleGenerateAdminAccount = async () => {
    if (!adminForm.email || !adminForm.name) {
      showToast("Email and name are required.", "error");
      return;
    }
    const newAdmin: AdminAccount = {
      id: `admin-${generateId()}`,
      email: adminForm.email,
      name: adminForm.name,
      role: "admin",
      isGenerated: true,
      generatedBy: user?.uid || "unknown",
      createdAt: new Date().toISOString(),
    };
    try {
      await create("adminAccounts", newAdmin);
      setAdminAccounts([...adminAccounts, newAdmin]);
      showToast(`✅ Admin account generated for ${adminForm.name}!`);
    } catch (e) {
      showToast("Failed to create admin account", "error");
    }
  };

  const deleteAdminAccount = async (id: string) => {
    if (!confirm("Remove this admin account?")) return;
    try {
      await remove("adminAccounts", id);
      setAdminAccounts(adminAccounts.filter((a) => a.id !== id));
      showToast("Admin account removed.");
    } catch (e) {
      showToast("Failed to remove admin account", "error");
    }
  };

  const exportData = async () => {
    try {
      const data = {
        opportunities: await getOpportunities(),
        events: await getEvents(),
        tests: await getTests(),
        documents: await getDocuments(),
        adminAccounts: await getAdminAccounts(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gsic-admin-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("📦 Data exported!");
    } catch (e) {
      showToast("Export failed", "error");
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const typeIdx = headers.indexOf("type");
        const titleIdx = headers.indexOf("title");
        const organizerIdx = headers.indexOf("organizer");
        const descriptionIdx = headers.indexOf("description");
        const requiredSkillsIdx = headers.indexOf("requiredskills");
        const benefitsIdx = headers.indexOf("benefits");
        const deadlineIdx = headers.indexOf("deadline");
        const linkIdx = headers.indexOf("link");
        const statusIdx = headers.indexOf("status");
        const cpNameIdx = headers.indexOf("cpname");
        const cpContactIdx = headers.indexOf("cpcontact");
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          const opp: Opportunity = {
            id: `opp-${generateId()}`,
            type: (cols[typeIdx] as Opportunity["type"]) || "research",
            title: cols[titleIdx] || `Imported ${i}`,
            organizer: cols[organizerIdx] || "",
            description: cols[descriptionIdx] || "",
            requiredSkills: cols[requiredSkillsIdx] ? cols[requiredSkillsIdx].split(";").map((s) => s.trim()) : [],
            benefits: cols[benefitsIdx] ? cols[benefitsIdx].split(";").map((s) => s.trim()) : [],
            deadline: cols[deadlineIdx] || "",
            isAnnual: false,
            link: cols[linkIdx] || "",
            posterUrl: null,
            status: (cols[statusIdx] as Opportunity["status"]) || "active",
            cpName: cols[cpNameIdx] || "",
            cpContact: cols[cpContactIdx] || "",
          };
          await create("opportunities", opp);
          imported++;
        }
        showToast(`📥 Imported ${imported} opportunities`);
        await loadData();
      } catch (err) {
        console.error(err);
        showToast("CSV import failed", "error");
      }
    };
    reader.readAsText(file);
  };

  const sortableOpps = [...opportunities].sort((a, b) => {
    let cmp = 0;
    if (opportunitySort === "deadline") cmp = a.deadline.localeCompare(b.deadline);
    else if (opportunitySort === "title") cmp = a.title.localeCompare(b.title);
    else if (opportunitySort === "status") cmp = a.status.localeCompare(b.status);
    return opportunityDir === "asc" ? cmp : -cmp;
  });

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-hero-gradient font-body pt-20">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-white/60">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient font-body pt-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-heading">
              <span className="gradient-text">Admin Dashboard</span>
            </h1>
            <p className="text-sm text-white/40 mt-1 font-body">
              Manage events, opportunities, registrations, and admin accounts
            </p>
          </div>
          <button
            onClick={exportData}
            className="text-xs bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        <div className="flex flex-wrap gap-1 mb-6 border-b border-white/5 pb-4 text-sm">
          {[
            { id: "tabEvents", label: "📅 Events" },
            { id: "tabOpps", label: "🎯 Opportunities" },
            { id: "tabTests", label: "📝 Tests" },
            { id: "tabAdmins", label: "👑 Admin Accounts" },
            { id: "tabDocs", label: "📄 Documents" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === tab.id
                  ? "bg-[#3352CD]/30 border border-[#3352CD]/40 font-medium"
                  : "hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "tabEvents" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="glass rounded-2xl p-6 md:p-8">
              <h3 className="font-semibold mb-4 flex items-center gap-2 font-heading">
                <Plus className="w-4 h-4 text-[#5CE3B6]" /> Create New Event
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/40">Title *</label>
                    <input type="text" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g. PKM Bootcamp 2026" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6]" required />
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Type *</label>
                    <select value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as "bootcamp" | "sandbox" })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#5CE3B6]">
                      <option value="bootcamp">Bootcamp (PKM)</option>
                      <option value="sandbox">Sandbox</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Short Description</label>
                    <input type="text" value={eventForm.shortDescription} onChange={(e) => setEventForm({ ...eventForm, shortDescription: e.target.value })} placeholder="Brief summary..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6]" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Full Description *</label>
                    <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} rows={3} placeholder="Detailed description..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] resize-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/40">Start Date</label>
                      <input type="date" value={eventForm.startDate} onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#5CE3B6]" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40">End Date</label>
                      <input type="date" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#5CE3B6]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/40">Registration Deadline</label>
                      <input type="date" value={eventForm.registrationDeadline} onChange={(e) => setEventForm({ ...eventForm, registrationDeadline: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#5CE3B6]" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40">Location</label>
                      <input type="text" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="e.g. GSIC Lab, KM ITB" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Max Participants</label>
                    <input type="number" value={eventForm.maxParticipants} onChange={(e) => setEventForm({ ...eventForm, maxParticipants: parseInt(e.target.value) || 50 })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#5CE3B6]" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-[#5CE3B6]" />
                      <span className="text-xs font-semibold text-white/70">Assessment Configuration</span>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={eventForm.hasPreTest} onChange={(e) => setEventForm({ ...eventForm, hasPreTest: e.target.checked })} className="accent-[#5CE3B6]" />
                        <span className="text-xs text-white/60">Include Pre-Test (before event)</span>
                      </label>
                      {eventForm.hasPreTest && (
                        <div>
                          <label className="text-xs text-white/40">Pre-Test Explanation</label>
                          <textarea value={eventForm.preTestExplanation} onChange={(e) => setEventForm({ ...eventForm, preTestExplanation: e.target.value })} rows={3} placeholder="Explain what the pre-test is for..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] resize-none text-sm" />
                        </div>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={eventForm.hasPostTest} onChange={(e) => setEventForm({ ...eventForm, hasPostTest: e.target.checked })} className="accent-[#5CE3B6]" />
                        <span className="text-xs text-white/60">Include Post-Test (after event)</span>
                      </label>
                      {eventForm.hasPostTest && (
                        <div>
                          <label className="text-xs text-white/40">Post-Test Explanation</label>
                          <textarea value={eventForm.postTestExplanation} onChange={(e) => setEventForm({ ...eventForm, postTestExplanation: e.target.value })} rows={3} placeholder="Explain what the post-test is for..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] resize-none text-sm" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-xs text-white/30">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Pre/post tests will only appear on events that have them enabled.
                    </div>
                  </div>

                  <button onClick={handleCreateEvent} className="w-full bg-gradient-to-r from-[#3352CD] to-[#4a6cf7] hover:from-[#4a6cf7] hover:to-[#5a7cff] transition py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Create Event
                  </button>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 font-heading">
                <Layers className="w-4 h-4 text-[#5CE3B6]" /> Manage Events
              </h3>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-white/30">No events yet. Create one above!</div>
                ) : (
                  events.map((evt) => (
                    <div key={evt.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3352CD]/30 to-[#5CE3B6]/30 flex items-center justify-center flex-shrink-0">
                          {evt.type === "bootcamp" ? <GraduationCap className="w-4 h-4 text-[#5CE3B6]" /> : <Sparkles className="w-4 h-4 text-[#5CE3B6]" />}
                        </div>
                        <div className="truncate">
                          <span className="text-sm font-medium block truncate">{evt.title}</span>
                          <span className="text-[10px] text-white/30">{evt.type} · {evt.status}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteEvent(evt.id)} className="text-xs text-red-400 hover:text-red-300" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "tabOpps" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 font-heading">
                <Target className="w-4 h-4 text-[#5CE3B6]" /> Opportunities ({opportunities.length})
              </h3>

              <div className="flex flex-wrap gap-2 mb-4">
                <input
                  value={opportunitySearch}
                  onChange={(e) => setOpportunitySearch(e.target.value)}
                  placeholder="Search opportunities..."
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6]"
                />
                <select
                  value={opportunitySort}
                  onChange={(e) => setOpportunitySort(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="deadline">Sort: Deadline</option>
                  <option value="title">Sort: Title</option>
                  <option value="status">Sort: Status</option>
                </select>
                <button
                  onClick={() => setOpportunityDir(opportunityDir === "asc" ? "desc" : "asc")}
                  className="bg-white/10 px-3 py-2 rounded-xl border border-white/10"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
                <label className="bg-white/10 px-3 py-2 rounded-xl border border-white/10 cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10">
                      <th className="py-2">Title</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Organizer</th>
                      <th className="py-2">Deadline</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Benefits</th>
                      <th className="py-2">Contact</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortableOpps.filter((o) => o.title.toLowerCase().includes(opportunitySearch.toLowerCase())).map((opp) => {
                      const days = new Date(opp.deadline).getTime() - new Date().getTime();
                      const daysLeft = Math.ceil(days / (1000 * 60 * 60 * 24));
                      const deadlineColor = daysLeft <= 0 ? "text-red-400" : daysLeft <= 7 ? "text-orange-400" : "text-[#5CE3B6]";
                      return (
                        <tr key={opp.id} className="border-b border-white/5">
                          <td className="py-2 font-medium">{opp.title}</td>
                          <td className="py-2">{getTypeLabel(opp.type)}</td>
                          <td className="py-2">{opp.organizer}</td>
                          <td className={`py-2 ${deadlineColor}`}>{opp.deadline} <span className="text-xs">({daysLeft} days)</span></td>
                          <td className="py-2">{opp.status}</td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-1">
                              {opp.benefits.map((b, i) => (
                                <span key={i} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{b}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 text-xs text-white/60">{opp.cpName} · {opp.cpContact}</td>
                          <td className="py-2 flex gap-2">
                            <button onClick={async () => { opp.status = opp.status === "active" ? "archived" : "active"; await update("opportunities", opp.id, { status: opp.status }); loadData(); }} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">Toggle</button>
                            <button onClick={async () => { await remove("opportunities", opp.id); loadData(); }} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 font-heading">
                <Calendar className="w-4 h-4 text-[#F2F8C9]" /> Curated Opportunities ({curated.length})
              </h3>
              <div className="space-y-2">
                {curated.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                    <div className="truncate">
                      <span className="text-sm font-medium block truncate">{c.title}</span>
                      <span className="text-[10px] text-white/30">Opens {c.monthOpen}</span>
                    </div>
                    <button onClick={async () => { await remove("curated", c.id); loadData(); }} className="text-xs text-red-400 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "tabTests" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 font-heading">
                <Award className="w-4 h-4 text-[#5CE3B6]" /> Tests ({tests.length})
              </h3>
              <div className="space-y-2">
                {tests.length === 0 ? (
                  <div className="text-center py-8 text-white/30">No tests yet. Tests are created automatically when you create an event with pre/post test enabled.</div>
                ) : (
                  tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                      <div className="truncate">
                        <span className="text-sm font-medium block truncate">{test.title}</span>
                        <span className="text-[10px] text-white/30">{test.type} · {test.eventId} · {test.questions.length} questions</span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <span className="text-xs bg-white/10 px-2 py-1 rounded">{test.type === "pre" ? "Pre" : "Post"}</span>
                        <button onClick={async () => { await remove("tests", test.id); loadData(); }} className="text-xs text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "tabAdmins" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="glass rounded-2xl p-6 md:p-8">
              <h3 className="font-semibold mb-4 flex items-center gap-2 font-heading">
                <Plus className="w-4 h-4 text-[#5CE3B6]" /> Generate Admin Account
              </h3>
              <p className="text-xs text-white/40 mb-4 font-body">
                Generate a new admin account. The admin will receive an email with credentials and a link to set their password.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-white/40">Full Name *</label>
                  <input type="text" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} placeholder="e.g. Admin User" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6]" />
                </div>
                <div>
                  <label className="text-xs text-white/40">Email *</label>
                  <input type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="admin@gsic.ganesha.edu" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6]" />
                </div>
                <div className="flex items-end">
                  <button onClick={handleGenerateAdminAccount} className="w-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#a78bfa] hover:to-[#7c3aed] transition py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Generate
                  </button>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 font-heading">
                <Shield className="w-4 h-4 text-[#5CE3B6]" /> Admin Accounts ({adminAccounts.length})
              </h3>
              <p className="text-xs text-white/40 mb-3">Note: Admin status is controlled via Firestore user profile `role` field set to `admin`.</p>
              <div className="space-y-2">
                {adminAccounts.length === 0 ? (
                  <div className="text-center py-8 text-white/30">No admin accounts generated yet.</div>
                ) : (
                  adminAccounts.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                      <div className="truncate">
                        <span className="text-sm font-medium block truncate">{admin.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/30">{admin.email}</span>
                          <button onClick={() => { navigator.clipboard.writeText(admin.email); showToast("📋 Email copied to clipboard!"); }} className="text-white/30 hover:text-white/60" title="Copy email">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[10px] text-white/40">Generated {new Date(admin.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => deleteAdminAccount(admin.id)} className="text-xs text-red-400 hover:text-red-300" title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "tabDocs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 font-heading">
                <FileText className="w-4 h-4 text-[#5CE3B6]" /> Documents ({documents.length})
              </h3>
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-white/30">No documents yet.</div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                      <div className="truncate">
                        <span className="text-sm font-medium block truncate">{doc.title}</span>
                        <span className="text-[10px] text-white/30">{doc.type} · {doc.url}</span>
                      </div>
                      <button onClick={async () => { await remove("documents", doc.id); loadData(); }} className="text-xs text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
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