"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Shield, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signInAnonymously,
} from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FACULTY_MAJOR_MAP } from "@/lib/types";
import Navbar from "@/components/Navbar";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    faculty: "",
    major: "",
    whatsapp: "",
    year: new Date().getFullYear(),
    skillsCSV: "",
  });

  const majors = FACULTY_MAJOR_MAP[form.faculty as keyof typeof FACULTY_MAJOR_MAP] || [];

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!form.name || !form.email || !form.password) {
          showToast("All fields are required.", "error");
          setLoading(false);
          return;
        }
        if (form.password.length < 8) {
          showToast("Password must be at least 8 characters.", "error");
          setLoading(false);
          return;
        }

        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        if (userCred.user) {
          await updateProfile(userCred.user, { displayName: form.name });
          const profile = {
            uid: userCred.user.uid,
            htaId: `HTA-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            email: form.email,
            name: form.name,
            faculty: form.faculty,
            major: form.major,
            year: form.year,
            whatsapp: form.whatsapp,
            avatarUrl: null,
            classcardTheme: "blue",
            skills: form.skillsCSV.split(",").map((s) => s.trim()).filter(Boolean),
            bio: "",
            isVerified: false,
            role: "user",
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(doc(db, "users", userCred.user.uid), profile);
          } catch (err) {
            console.error("Error creating profile:", err);
            localStorage.setItem(`gsic_profile_${userCred.user.uid}`, JSON.stringify(profile));
          }
          await sendEmailVerification(userCred.user, {
            url: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/dashboard`,
            handleCodeInApp: false,
          });
          showToast("📧 Verification email sent! Please check your inbox.");
          setIsSignUp(false);
          setForm({ name: "", email: "", password: "", faculty: "", major: "", whatsapp: "", year: new Date().getFullYear(), skillsCSV: "" });
        }
      } else {
        if (!form.email || !form.password) {
          showToast("Email and password are required.", "error");
          setLoading(false);
          return;
        }
        const userCred = await signInWithEmailAndPassword(auth, form.email, form.password);
        if (userCred.user && !userCred.user.emailVerified) {
          showToast("⚠️ Please verify your email before continuing.", "error");
          await sendEmailVerification(userCred.user, {
            url: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/dashboard`,
            handleCodeInApp: false,
          });
          showToast("📧 Verification email resent! Please check your inbox.");
          setLoading(false);
          return;
        }
        showToast("👋 Welcome back!");
        router.push("/dashboard");
      }
    } catch (err: any) {
      showToast(err.message || "An error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      showToast("👋 Signed in as guest!");
      router.push("/dashboard");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient font-body pt-20">
      <Navbar />
      <div className="fixed w-[500px] h-[500px] rounded-full bg-[#3352CD] opacity-[0.06] blur-[100px] pointer-events-none -top-[200px] -left-[200px] animate-float-blob z-0" />
      <div className="fixed w-[400px] h-[400px] rounded-full bg-[#5CE3B6] opacity-[0.06] blur-[100px] pointer-events-none -bottom-[150px] -right-[150px] animate-float-blob z-0" style={{ animationDelay: "8s" }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
          <div className="glass rounded-2xl p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">G</div>
              <h1 className="text-2xl font-bold font-heading">{isSignUp ? "Create Your Account" : "Welcome Back"}</h1>
              <p className="text-sm text-white/40 mt-2 font-body">{isSignUp ? "Join GSIC-Research-Hub" : "Sign in to access your dashboard"}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ganesha Student" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] transition" required />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@ganesha.edu" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] transition" required />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] transition" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Faculty</label>
                      <select value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value, major: "" })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#5CE3B6]">
                        <option value="">Select faculty</option>
                        {Object.keys(FACULTY_MAJOR_MAP).map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Major</label>
                      <select value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#5CE3B6]" disabled={!form.faculty}>
                        <option value="">Select major</option>
                        {majors.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">WhatsApp</label>
                      <input type="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+62 812-3456-7890" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6]" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Year</label>
                      <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#5CE3B6]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Skills (comma separated)</label>
                    <input type="text" value={form.skillsCSV} onChange={(e) => setForm({ ...form, skillsCSV: e.target.value })} placeholder="Research, Data Analysis, Writing" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6]" />
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#3352CD] to-[#4a6cf7] hover:from-[#4a6cf7] hover:to-[#5a7cff] transition font-medium py-3 rounded-xl shadow-lg shadow-[#3352CD]/30 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Rocket className="w-4 h-4" />}
                {isSignUp ? "Create Account" : "Sign In"}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-xs text-white/40"><span className="px-2 bg-[#0a0a2e]">or</span></div>
            </div>

            <button onClick={handleAnonymousSignIn} disabled={loading} className="w-full bg-white/5 hover:bg-white/10 transition py-3 rounded-xl border border-white/10 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              <Shield className="w-4 h-4" /> Continue as Guest
            </button>

            <p className="text-center text-xs text-white/40 mt-6">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#5CE3B6] hover:underline ml-1">{isSignUp ? "Sign In" : "Sign Up"}</button>
            </p>
          </div>
        </motion.div>
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