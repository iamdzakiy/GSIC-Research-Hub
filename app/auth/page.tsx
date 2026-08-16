"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Shield, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { signUp, signIn, supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (isSignUp) {
        const { user, session } = await signUp(email, password, name);
        setMessage("✅ Please check your email to confirm your account. After confirmation, sign in.");
        setIsSignUp(false);
      } else {
        const { user, session } = await signIn(email, password);
        if (user && !user.confirmed_at) {
          setMessage("⚠️ Please confirm your email first. Check your inbox.");
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
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ganesha Student" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] transition" required />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@ganesha.edu" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] transition" required />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] transition" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#3352CD] to-[#4a6cf7] hover:from-[#4a6cf7] hover:to-[#5a7cff] transition font-medium py-3 rounded-xl shadow-lg shadow-[#3352CD]/30 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Rocket className="w-4 h-4" />}
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </form>

            {message && (
              <div className="mt-4 text-center text-sm text-white/70">{message}</div>
            )}

            <p className="text-center text-xs text-white/40 mt-6">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#5CE3B6] hover:underline ml-1">{isSignUp ? "Sign In" : "Sign Up"}</button>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}