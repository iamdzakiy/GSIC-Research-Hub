"use client";
import { useState } from "react";
import { MailCheck, MailWarning, Loader2 } from "lucide-react";

/** Shown until the Supabase email is confirmed. Resend goes through the rate-limited, non-enumerating API. */
export default function VerifyBanner({ email, verified }: { email: string; verified: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  if (verified) return null;
  const resend = async () => {
    setState("sending");
    try {
      const r = await fetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Gagal mengirim ulang.");
      setState("sent"); setMsg("Email verifikasi dikirim. Cek kotak masuk dan folder spam.");
    } catch (e) { setState("error"); setMsg((e as Error).message); }
  };
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-300 bg-cream-100 px-4 py-3 text-sm text-slate-800">
      <p className="flex items-center gap-2">{state === "sent" ? <MailCheck className="h-5 w-5 text-mint-700" aria-hidden="true" /> : <MailWarning className="h-5 w-5 text-slate-600" aria-hidden="true" />}{state === "sent" || state === "error" ? msg : "Email Anda belum terverifikasi. Verifikasi untuk mengamankan akun dan menerima pengumuman."}</p>
      {state !== "sent" && <button type="button" onClick={resend} disabled={state === "sending"} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{state === "sending" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />} Kirim ulang</button>}
    </div>
  );
}
