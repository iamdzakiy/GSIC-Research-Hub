"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  User,
  AlertCircle,
  Rocket,
  Sparkles,
  Palette,
  Globe,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Navbar from "@/components/Navbar";
import {
  SANDBOX_EVENT,
  formatDate,
  daysUntil,
  getEventStatusColor,
  getEventStatusText,
} from "@/lib/data";
import { getRegistrations, create } from "@/lib/firestore";
import { GSICEvent, Registration } from "@/lib/types";

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SandboxPage() {
  const { user, userProfile, loading } = useAuth();
  const [event, setEvent] = useState<GSICEvent>(SANDBOX_EVENT);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [regForm, setRegForm] = useState({
    motivation: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const regs = await getRegistrations();
      setRegistrations(regs);
    } catch (e) {
      console.error("Firestore load error:", e);
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const userRegistration = user
    ? registrations.find((r) => r.userId === user.uid && r.eventId === event.id)
    : null;

  const isRegistered = !!userRegistration;

  const handleRegister = async () => {
    if (!user) {
      showToast("Please sign in to register.", "error");
      return;
    }
    if (!regForm.motivation.trim()) {
      showToast("Please tell us your motivation.", "error");
      return;
    }

    const newReg: Registration = {
      id: `reg-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`,
      userId: user.uid,
      eventId: event.id,
      status: "confirmed",
      preTestCompleted: false,
      postTestCompleted: false,
      registeredAt: new Date().toISOString(),
    };

    try {
      await create("registrations", newReg);
      setRegistrations([...registrations, newReg]);
      showToast(`🎉 Registered for ${event.title}!`);
    } catch (e) {
      console.error(e);
      showToast("Failed to register.", "error");
    }
  };

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

  return (
    <div className="min-h-screen bg-hero-gradient font-body pt-20">
      <Navbar />

      {/* Floating blobs */}
      <div className="fixed w-[500px] h-[500px] rounded-full bg-[#5CE3B6] opacity-[0.06] blur-[100px] pointer-events-none -top-[200px] -left-[200px] animate-float-blob z-0" style={{ animationDelay: "4s" }} />
      <div className="fixed w-[400px] h-[400px] rounded-full bg-[#F2F8C9] opacity-[0.06] blur-[100px] pointer-events-none -bottom-[150px] -right-[150px] animate-float-blob z-0" style={{ animationDelay: "12s" }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* ============================================================ */}
        {/* EVENT HEADER */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 md:p-12 mb-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5CE3B6] to-[#F2F8C9] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#3352CD]" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold font-heading">
                    <span className="gradient-text-blue">{event.title}</span>
                  </h1>
                  <p className="text-sm text-white/40 font-body mt-1">
                    {event.shortDescription}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className={`text-xs px-3 py-1 rounded-full ${getEventStatusColor(event.status)}`}>
                  {getEventStatusText(event.status)}
                </span>
                <span className="text-xs bg-[#5CE3B6]/10 text-[#5CE3B6] px-3 py-1 rounded-full">
                  Sandbox
                </span>
                {/* No pre/post test indicators for this event */}
                <span className="text-xs bg-white/5 text-white/50 px-3 py-1 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> No Assessments
                </span>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#5CE3B6]" />
                <div>
                  <div className="text-xs text-white/40">Start Date</div>
                  <div className="font-medium">{formatDate(event.startDate)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#5CE3B6]" />
                <div>
                  <div className="text-xs text-white/40">End Date</div>
                  <div className="font-medium">{formatDate(event.endDate)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#5CE3B6]" />
                <div>
                  <div className="text-xs text-white/40">Location</div>
                  <div className="font-medium">{event.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#5CE3B6]" />
                <div>
                  <div className="text-xs text-white/40">Participants</div>
                  <div className="font-medium">
                    {event.currentParticipants}/{event.maxParticipants}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#5CE3B6]" />
                <div>
                  <div className="text-xs text-white/40">Registration Deadline</div>
                  <div className="font-medium">
                    {formatDate(event.registrationDeadline)}
                    <span className={`text-xs ml-2 ${daysUntil(event.registrationDeadline) <= 7 ? "text-red-400" : "text-[#5CE3B6]"}`}>
                      ({daysUntil(event.registrationDeadline)} days left)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold font-heading mb-3">About This Event</h2>
              <p className="text-sm text-white/60 font-body leading-relaxed mb-4">
                {event.description}
              </p>

              {/* No Pre/Post Test Explanation - this event doesn't have them */}
              <div className="glass rounded-xl p-4 border-l-4 border-[#5CE3B6]">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#5CE3B6] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#5CE3B6] uppercase tracking-wider mb-1">
                      Assessment Policy
                    </div>
                    <p className="text-xs text-white/70 font-body leading-relaxed">
                      This event does not include pre-test or post-test assessments.
                      Just bring your curiosity and creativity! Focus on hands-on
                      collaboration, ideation, and rapid prototyping.
                    </p>
                  </div>
                </div>
              </div>

              {/* Clusters */}
              <div className="mt-4">
                <div className="text-xs text-white/40 mb-2">Clusters</div>
                <div className="flex flex-wrap gap-2">
                  {event.clusters.map((cluster) => (
                    <span
                      key={cluster}
                      className="text-xs bg-white/5 px-2.5 py-1 rounded-full"
                    >
                      {cluster.charAt(0).toUpperCase() + cluster.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* REGISTRATION / NO TEST SECTION */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 md:p-8"
          >
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-6 font-heading">
              <span className="w-8 h-8 rounded-full bg-[#5CE3B6]/20 flex items-center justify-center">
                <User className="w-4 h-4 text-[#5CE3B6]" />
              </span>
              {isRegistered ? "Your Registration" : "Register for Sandbox"}
            </h3>

            {isRegistered ? (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">Status</div>
                  <div className="font-medium text-[#5CE3B6]">
                    ✅ Confirmed
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">Registered At</div>
                  <div className="font-medium text-sm">
                    {new Date(userRegistration!.registeredAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">Assessments</div>
                  <div className="font-medium text-white/40 text-sm">
                    None (no pre/post test for this event)
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegister();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                    Your Name
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white">
                    {userProfile?.name || user?.email || "Sign in to register"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">
                    Motivation
                  </label>
                  <textarea
                    value={regForm.motivation}
                    onChange={(e) => setRegForm({ ...regForm, motivation: e.target.value })}
                    rows={3}
                    placeholder="Why do you want to join The Sandbox?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] focus:bg-white/5 transition resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#5CE3B6] to-[#3ab88a] hover:from-[#3ab88a] hover:to-[#5CE3B6] transition font-medium py-3 rounded-xl shadow-lg shadow-[#5CE3B6]/30 flex items-center justify-center gap-2"
                >
                  <Rocket className="w-4 h-4" /> Register Now
                </button>
              </form>
            )}
          </motion.div>

          {/* No Test Panel - This event has no pre/post tests */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6 md:p-8 h-full flex flex-col justify-center"
            >
              <h4 className="font-semibold flex items-center gap-2 mb-4 font-heading">
                <AlertCircle className="w-5 h-5 text-[#5CE3B6]" />
                No Pre-Test or Post-Test
              </h4>
              <p className="text-sm text-white/60 font-body leading-relaxed mb-6">
                Unlike the PKM Bootcamp, The Sandbox does not include pre-test or
                post-test assessments. This is an exploratory, hands-on co-creation
                space where you'll work with interdisciplinary teams to build
                innovative solutions. Your learning is measured through project
                outcomes and peer collaboration, not standardized tests.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Palette className="w-6 h-6 text-[#5CE3B6] mx-auto mb-2" />
                  <div className="text-xs font-semibold">Design Thinking</div>
                  <div className="text-xs text-white/40 mt-1">Empathy → Ideation → Prototyping</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Globe className="w-6 h-6 text-[#5CE3B6] mx-auto mb-2" />
                  <div className="text-xs font-semibold">Cross-Major</div>
                  <div className="text-xs text-white/40 mt-1">Interdisciplinary teams</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Sparkles className="w-6 h-6 text-[#5CE3B6] mx-auto mb-2" />
                  <div className="text-xs font-semibold">Showcase</div>
                  <div className="text-xs text-white/40 mt-1">Present your creation</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MODULES */}
        {/* ============================================================ */}
        {event.modules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-6 font-heading">
              <BookOpen className="w-5 h-5 text-[#F2F8C9]" /> Sandbox Modules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {event.modules
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((mod) => (
                  <div
                    key={mod.id}
                    className="glass rounded-2xl p-5 card-hover border-t-4 border-[#5CE3B6]"
                  >
                    <h4 className="text-base font-semibold font-heading mb-2">
                      {mod.title}
                    </h4>
                    <p className="text-xs text-white/50 mb-3 leading-relaxed font-body">
                      {mod.description}
                    </p>
                    <div className="flex justify-between text-xs text-white/40">
                      <span>⏱️ {mod.durationHours}h</span>
                      <span>
                        🏷️ {mod.cluster.charAt(0).toUpperCase() + mod.cluster.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3.5 rounded-2xl glass border ${
            toast.type === "success" ? "border-[#5CE3B6]" : "border-red-400"
          } text-white font-medium z-50 shadow-2xl backdrop-blur-xl flex items-center gap-2`}
        >
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
