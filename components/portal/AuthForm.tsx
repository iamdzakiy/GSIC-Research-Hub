"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import { emailOnlySchema, fieldErrors, registerSchema, resetPasswordSchema, signInSchema } from "@/lib/validation/auth";

export type AuthMode = "signin" | "signup" | "magic" | "forgot" | "reset";

const TITLES: Record<AuthMode, { h: string; p: string; cta: string }> = {
  signin: { h: "Masuk ke GSIC Hub", p: "Gunakan email dan kata sandi Anda.", cta: "Masuk" },
  signup: { h: "Buat akun", p: "Daftar untuk menyimpan peluang dan mengikuti event GSIC.", cta: "Daftar" },
  magic: { h: "Masuk dengan tautan email", p: "Kami kirim tautan sekali pakai ke email Anda — tanpa kata sandi.", cta: "Kirim tautan masuk" },
  forgot: { h: "Lupa kata sandi", p: "Masukkan email akun Anda untuk menerima tautan atur ulang.", cta: "Kirim tautan atur ulang" },
  reset: { h: "Buat kata sandi baru", p: "Pilih kata sandi baru untuk akun Anda.", cta: "Simpan kata sandi" },
};

function mapSupabaseError(msg: string): string {
  if (/invalid login/i.test(msg)) return "Email atau kata sandi salah.";
  if (/not confirmed/i.test(msg)) return "Email belum diverifikasi.";
  if (/rate limit|too many/i.test(msg)) return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
  return msg;
}

function strength(pw: string): { score: number; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return { score: Math.min(s, 4), label: ["Lemah", "Lemah", "Cukup", "Baik", "Kuat"][Math.min(s, 4)]! };
}

interface Sent { email: string; kind: "verify" | "magic" | "reset" }

/** Post-login destination from ?next=, restricted to same-site paths (no open redirect). */
function safeNext(): string {
  try {
    const n = new URLSearchParams(window.location.search).get("next");
    return n && /^\/(?!\/)[\w\-/?=&%.]*$/.test(n) ? n : "/dashboard";
  } catch { return "/dashboard"; }
}

export default function AuthForm({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [needsVerify, setNeedsVerify] = useState(false);

  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const copy = TITLES[mode];
  const pw = useMemo(() => strength(password), [password]);
  const usesPassword = mode === "signin" || mode === "signup" || mode === "reset";

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setErrors({});
    setNeedsVerify(false);
    router.replace(`/auth?mode=${m}`, { scroll: false });
  };

  async function post(path: string, body: unknown): Promise<{ ok: boolean; message?: string; error?: string; fieldErrors?: Record<string, string>; retryAfterSec?: number }> {
    try {
      const res = await fetch(`/api/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return await res.json();
    } catch {
      return { ok: false, error: "Tidak dapat terhubung ke server. Periksa koneksi Anda." };
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErrors({});
    setNeedsVerify(false);

    // 1) client-side validation (same zod schemas as the server)
    const schema = { signin: signInSchema, signup: registerSchema, magic: emailOnlySchema, forgot: emailOnlySchema, reset: resetPasswordSchema }[mode];
    const values = { name, email, password, confirm };
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) {
          if (/not confirmed/i.test(error.message)) setNeedsVerify(true);
          setErrors({ form: mapSupabaseError(error.message) });
          return;
        }
        toast("success", "Berhasil masuk.");
        router.replace(safeNext());
        return;
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setErrors({ form: /session/i.test(error.message) ? "Tautan sudah kedaluwarsa. Minta tautan atur ulang baru." : mapSupabaseError(error.message) });
          return;
        }
        toast("success", "Kata sandi berhasil diperbarui.");
        router.replace(safeNext());
        return;
      }

      const endpoint = { signup: "register", magic: "magic-link", forgot: "forgot-password" }[mode];
      const res = await post(endpoint, values);
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        setErrors((p) => ({ ...p, form: res.error ?? "Terjadi kesalahan." }));
        if (res.retryAfterSec) setCooldown(Math.min(res.retryAfterSec, 600));
        return;
      }
      setSent({ email: email.trim().toLowerCase(), kind: mode === "signup" ? "verify" : mode === "magic" ? "magic" : "reset" });
      setCooldown(60);
    } finally {
      setLoading(false);
    }
  }

  async function resend(kind: Sent["kind"], to: string) {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    const path = kind === "verify" ? "resend-verification" : kind === "magic" ? "magic-link" : "forgot-password";
    const res = await post(path, { email: to });
    setLoading(false);
    if (res.ok) {
      toast("success", "Email dikirim ulang.");
      setCooldown(60);
    } else {
      toast("error", res.error ?? "Gagal mengirim ulang email.");
      if (res.retryAfterSec) setCooldown(Math.min(res.retryAfterSec, 600));
    }
  }

  const input = (id: string, hasErr: boolean) =>
    cn(
      "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2",
      hasErr ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20"
    ) + (id === "password" || id === "confirm" ? " pr-11" : "");

  // ---------- "email sent" confirmation ----------
  if (sent) {
    const label = sent.kind === "verify" ? "verifikasi" : sent.kind === "magic" ? "masuk" : "atur ulang kata sandi";
    return (
      <div className="text-center" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <MailCheck className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 font-heading">Periksa email Anda</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Jika alamat <span className="font-medium text-slate-900">{sent.email}</span> dapat digunakan, tautan {label} telah dikirim. Cek juga folder spam.
        </p>
        <button
          type="button"
          onClick={() => resend(sent.kind, sent.email)}
          disabled={cooldown > 0 || loading}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {cooldown > 0 ? `Kirim ulang dalam ${cooldown} dtk` : "Kirim ulang email"}
        </button>
        <button type="button" onClick={() => { setSent(null); switchMode("signin"); }} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke halaman masuk
        </button>
      </div>
    );
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p id={`${k}-err`} className="mt-1.5 text-xs text-rose-600">{errors[k]}</p> : null);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">{copy.h}</h1>
      <p className="mt-1.5 text-sm text-slate-600">{copy.p}</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {errors.form && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
            {errors.form}
            {needsVerify && (
              <button type="button" onClick={() => resend("verify", email.trim().toLowerCase())} disabled={cooldown > 0 || loading} className="mt-2 block font-medium underline disabled:no-underline disabled:opacity-60">
                {cooldown > 0 ? `Kirim ulang verifikasi (${cooldown} dtk)` : "Kirim ulang email verifikasi"}
              </button>
            )}
            {!needsVerify && cooldown > 0 && <span className="mt-1 block text-xs">Coba lagi dalam {cooldown} dtk.</span>}
          </div>
        )}

        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">Nama lengkap</label>
            <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama sesuai KTM" className={input("name", !!errors.name)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
            <Err k="name" />
          </div>
        )}

        {mode !== "reset" && (
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@mahasiswa.itb.ac.id" className={input("email", !!errors.email)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} />
            <Err k="email" />
          </div>
        )}

        {usesPassword && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">{mode === "reset" ? "Kata sandi baru" : "Kata sandi"}</label>
              {mode === "signin" && (
                <button type="button" onClick={() => switchMode("forgot")} className="text-xs font-medium text-brand-700 hover:underline">Lupa kata sandi?</button>
              )}
            </div>
            <div className="relative">
              <input id="password" type={show ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signin" ? "Kata sandi Anda" : "Minimal 8 karakter, huruf & angka"} className={input("password", !!errors.password)} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-err" : undefined} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Err k="password" />
            {mode !== "signin" && password && (
              <div className="mt-2" aria-live="polite">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={cn("h-1 flex-1 rounded-full", i <= pw.score ? (pw.score <= 1 ? "bg-rose-400" : pw.score === 2 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-200")} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">Kekuatan: {pw.label}</p>
              </div>
            )}
          </div>
        )}

        {mode === "reset" && (
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-slate-700">Ulangi kata sandi</label>
            <input id="confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input("confirm", !!errors.confirm)} aria-invalid={!!errors.confirm} aria-describedby={errors.confirm ? "confirm-err" : undefined} />
            <Err k="confirm" />
          </div>
        )}

        <button type="submit" disabled={loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading ? "Memproses…" : copy.cta}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm text-slate-600">
        {mode === "signin" && (
          <>
            <button type="button" onClick={() => switchMode("magic")} className="font-medium text-brand-700 hover:underline">Masuk dengan tautan email</button>
            <p>Belum punya akun? <button type="button" onClick={() => switchMode("signup")} className="font-medium text-brand-700 hover:underline">Daftar</button></p>
          </>
        )}
        {mode === "signup" && <p>Sudah punya akun? <button type="button" onClick={() => switchMode("signin")} className="font-medium text-brand-700 hover:underline">Masuk</button></p>}
        {(mode === "magic" || mode === "forgot") && (
          <button type="button" onClick={() => switchMode("signin")} className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke halaman masuk
          </button>
        )}
        {mode === "reset" && <Link href="/auth?mode=signin" className="font-medium text-brand-700 hover:underline">Kembali ke halaman masuk</Link>}
      </div>
    </div>
  );
}
