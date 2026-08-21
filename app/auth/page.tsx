"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Rocket,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signUp, signIn, supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { FACULTY_MAJOR_MAP, FACULTY_NAMES } from "@/lib/types";

const STEPS = [
  { id: 1, label: "Sign Up", desc: "Identity & Credentials" },
  { id: 2, label: "Verify Email", desc: "Secure Authentication" },
  { id: 3, label: "Enter Arena", desc: "Join PKM-Bootcamp / Sandbox" },
];

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["#EF4444", "#F59E0B", "#F59E0B", "#10B981", "#10B981"];
  return { score: Math.min(score, 5), label: labels[Math.min(score, 5) - 1], color: colors[Math.min(score, 5) - 1] };
}

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(true);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [major, setMajor] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);

  const strength = getPasswordStrength(password);
  const majors = useMemo(() => (faculty ? FACULTY_MAJOR_MAP[faculty] || [] : []), [faculty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (isSignUp) {
        const { user, session } = await signUp(email, password, name);
        setStep(2);
        setMessage("✅ Check your email to verify your account.");
      } else {
        const { user, session } = await signIn(email, password);
        if (user && !user.confirmed_at) {
          setMessage("⚠️ Please confirm your email first.");
          setLoading(false);
          return;
        }
        router.push("/dashboard");
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      setVerified(true);
      setStep(3);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient font-body pt-20 mesh-gradient">
      <Navbar />
      <div className="fixed w-[500px] h-[500px] rounded-full bg-[#2563EB] opacity-[0.06] blur-[100px] pointer-events-none -top-[200px] -left-[200px] animate-float-blob z-0" />
      <div className="fixed w-[400px] h-[400px] rounded-full bg-[#06B6D4] opacity-[0.06] blur-[100px] pointer-events-none -bottom-[150px] -right-[150px] animate-float-blob z-0" style={{ animationDelay: "8s" }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
          {/* Stepper Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <motion.div
                      animate={{
                        scale: step === s.id ? 1.1 : 1,
                        backgroundColor: step >= s.id ? "#2563EB" : "rgba(255,255,255,0.08)",
                        borderColor: step >= s.id ? "#2563EB" : "rgba(255,255,255,0.15)",
                      }}
                      className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold"
                    >
                      {step > s.id ? <CheckCircle2 className="w-5 h-5 text-white" /> : s.id}
                    </motion.div>
                    <div className="text-[10px] mt-2 text-center text-white/50 font-medium">{s.label}</div>
                    <div className="text-[9px] text-white/30 text-center">{s.desc}</div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: step > s.id ? "100%" : "0%" }}
                        className="h-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-8 md:p-10 glow-border">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 glow-blue">G</div>
                    <h1 className="text-2xl font-bold font-heading">{isSignUp ? "Create Your Account" : "Welcome Back"}</h1>
                    <p className="text-sm text-white/40 mt-2 font-body">{isSignUp ? "Join GSIC Research & PKM-Bootcamp" : "Sign in to access your dashboard"}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {isSignUp && (
                      <>
                        <div>
                          <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ganesha Student" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-white/20 focus:outline-none focus:border-[#2563EB] input-glow transition" required />
                          </div>
                        </div>

                        {/* Academic Profile Selector */}
                        <div>
                          <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Faculty / School</label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <select
                              value={faculty}
                              onChange={(e) => { setFaculty(e.target.value); setMajor(""); }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white focus:outline-none focus:border-[#2563EB] input-glow transition appearance-none"
                            >
                              <option value="" className="bg-[#0F172A]">Select Faculty / School...</option>
                              {Object.keys(FACULTY_MAJOR_MAP).map((f) => (
                                <option key={f} value={f} className="bg-[#0F172A]">{f} — {FACULTY_NAMES[f]}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {faculty && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Major (ITB)</label>
                            <div className="relative">
                              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                              <select
                                value={major}
                                onChange={(e) => setMajor(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white focus:outline-none focus:border-[#2563EB] input-glow transition appearance-none"
                              >
                                <option value="" className="bg-[#0F172A]">Select Major...</option>
                                {majors.map((m) => (
                                  <option key={m.code} value={`${m.code} - ${m.name}`} className="bg-[#0F172A]">{m.code} — {m.name}</option>
                                ))}
                              </select>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}

                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@ganesha.edu" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-white/20 focus:outline-none focus:border-[#2563EB] input-glow transition" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-[#2563EB] input-glow transition" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {isSignUp && password && (
                        <div className="mt-2">
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ backgroundColor: i <= strength.score ? strength.color : "rgba(255,255,255,0.1)" }} />
                            ))}
                          </div>
                          <div className="text-[10px] mt-1" style={{ color: strength.color }}>{strength.label}</div>
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] hover:from-[#3B82F6] hover:to-[#22D3EE] transition font-medium py-3 rounded-xl shadow-lg shadow-[#2563EB]/30 flex items-center justify-center gap-2 disabled:opacity-50">
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Rocket className="w-4 h-4" />}
                      {isSignUp ? "Sign Up" : "Sign In"}
                    </button>
                  </form>

                  {message && <div className="mt-4 text-center text-sm text-white/70">{message}</div>}

                  <p className="text-center text-xs text-white/40 mt-6">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#06B6D4] hover:underline ml-1">{isSignUp ? "Sign In" : "Sign Up"}</button>
                  </p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 glow-blue">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold font-heading">Verify Your Email</h1>
                    <p className="text-sm text-white/40 mt-2 font-body">We sent a 6-digit OTP to <span className="text-[#06B6D4]">{email}</span></p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">6-Digit OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                        placeholder="••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-white/20 focus:outline-none focus:border-[#2563EB] input-glow transition"
                      />
                    </div>
                    <button onClick={handleVerify} disabled={loading || otp.length !== 6} className="w-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] hover:from-[#3B82F6] hover:to-[#22D3EE] transition font-medium py-3 rounded-xl shadow-lg shadow-[#2563EB]/30 flex items-center justify-center gap-2 disabled:opacity-50">
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                      Verify My Account
                    </button>
                    <button onClick={() => setStep(1)} className="w-full text-xs text-white/40 hover:text-white/60 flex items-center justify-center gap-1">
                      <ArrowLeft className="w-3 h-3" /> Back to Sign Up
                    </button>
                  </div>

                  {message && <div className="mt-4 text-center text-sm text-white/70">{message}</div>}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-[#10B981] to-[#06B6D4] flex items-center justify-center mx-auto mb-6 glow-emerald"
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-bold font-heading mb-2">You're Verified!</h1>
                  <p className="text-sm text-white/50 mb-6">Welcome to the GSIC Research & PKM-Bootcamp ecosystem.</p>
                  <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                    <div className="text-xs text-white/40 mb-1">Your Participant ID</div>
                    <div className="text-xl font-bold font-heading gradient-text">GSIC-{new Date().getFullYear()}-{Math.random().toString(36).substring(2, 8).toUpperCase()}</div>
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => router.push("/")} className="w-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] hover:from-[#3B82F6] hover:to-[#22D3EE] transition font-medium py-3 rounded-xl shadow-lg shadow-[#2563EB]/30 flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" /> Explore Sandbox
                    </button>
                    <button onClick={() => router.push("/dashboard")} className="w-full bg-white/5 hover:bg-white/10 transition font-medium py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Complete Bootcamp Profile
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}