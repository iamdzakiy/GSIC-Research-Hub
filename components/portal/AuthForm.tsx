"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import { uploadCv } from "@/services/userService";
import { accountSchema, emailOnlySchema, fieldErrors, profileStepSchema, registerSchema, resetPasswordSchema, signInSchema } from "@/lib/validation/auth";
import { NIM_TAKEN, nimLabel } from "@/lib/nim";
import { ago, clearDraft, loadDraft, sanitize, saveDraft, type SignupDraft } from "@/lib/signup-draft";
import type { NimAvailability } from "@/components/portal/NimField";
import SaveStatus, { type SaveState } from "@/components/motion/SaveStatus";
import { FIELDS, INTERESTS, PKM_ROLES, PREFERRED_ROLES, labelOf } from "@/lib/profile-options";
import ProfileFields, { EMPTY_PROFILE, type ProfileValues } from "@/components/portal/ProfileFields";

export type AuthMode = "signin" | "signup" | "magic" | "forgot" | "reset";

const TITLES: Record<AuthMode, { h: string; p: string; cta: string }> = {
  signin: { h: "Sign in to GSIC Hub", p: "Use your email and password.", cta: "Sign in" },
  signup: { h: "Create your account", p: "Save opportunities, join GSIC events and keep your pre-test and post-test results in one place.", cta: "Continue" },
  magic: { h: "Sign in with an email link", p: "We email you a one-time link. No password needed.", cta: "Send sign-in link" },
  forgot: { h: "Reset your password", p: "Enter your account email and we will send a reset link.", cta: "Send reset link" },
  reset: { h: "Choose a new password", p: "Pick a new password for your account.", cta: "Save password" },
};

function mapSupabaseError(msg: string): string {
  if (/invalid login/i.test(msg)) return "Incorrect email or password.";
  if (/rate limit|too many/i.test(msg)) return "Too many attempts. Try again in a few minutes.";
  return msg;
}

function strength(pw: string): { score: number; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return { score: Math.min(s, 4), label: ["Weak", "Weak", "Fair", "Good", "Strong"][Math.min(s, 4)]! };
}

interface Sent { email: string; kind: "magic" | "reset" }

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
  const [step, setStepRaw] = useState<1 | 2 | 3>(1);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const setStep = (n: 1 | 2 | 3) => { setDir(n < step ? "back" : "fwd"); setStepRaw(n); };
  const [pending, setPending] = useState<SignupDraft | null>(null);
  const [draftState, setDraftState] = useState<SaveState>("idle");
  const [draftFailed, setDraftFailed] = useState(false);
  const [nimAvail, setNimAvail] = useState<NimAvailability>("idle");
  const [bannerChecked, setBannerChecked] = useState(false);
  const [profile, setProfile] = useState<ProfileValues>(EMPTY_PROFILE);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Offer to continue a saved sign-up. Nothing is restored until the person says so, and nothing is written meanwhile.
  useEffect(() => {
    if (mode !== "signup") { setPending(null); return; }
    setPending(loadDraft(window.localStorage));
    setBannerChecked(true);
  }, [mode]);

  // Save as they type (debounced). Password fields are not part of the draft.
  useEffect(() => {
    if (mode !== "signup" || !bannerChecked || pending || done) return;
    if (!name && !email && profile === EMPTY_PROFILE) return;
    setDraftState("saving");
    const t = setTimeout(() => {
      const ok = saveDraft(window.localStorage, sanitize({ step, name, email, profile }));
      setDraftFailed(!ok);
      setDraftState(ok ? "saved" : "error");
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, email, profile, step, mode, bannerChecked, pending]);

  // Warn only about what the draft cannot hold: a browser that would not store it, or a CV file that is picked but not uploaded yet.
  useEffect(() => {
    if (mode !== "signup" || done) return;
    const dirty = draftFailed || !!cvFile;
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [mode, draftFailed, cvFile, done]);

  const copy = TITLES[mode];
  const touch = (k: string) => setTouched((t) => (t.has(k) ? t : new Set(t).add(k)));

  // Inline validation: once a field has been visited, re-check it as the user types.
  useEffect(() => {
    if (!touched.size && !profile.linkedinUrl) return;
    const schema = { signin: signInSchema, signup: step === 1 ? accountSchema : step === 2 ? profileStepSchema : registerSchema, magic: emailOnlySchema, forgot: emailOnlySchema, reset: resetPasswordSchema }[mode];
    const values = mode === "signup" ? { name, email, password, confirm, ...profile, whatsapp: profile.whatsapp || undefined, preferredRole: profile.preferredRole || null, pkmRole: profile.pkmRole || null } : { name, email, password, confirm };
    const parsed = schema.safeParse(values);
    const fe = parsed.success ? {} : fieldErrors(parsed.error);
    const keys = new Set(touched);
    if (profile.linkedinUrl) keys.add("linkedinUrl");
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => { if (fe[k]) next[k] = fe[k]!; else delete next[k]; });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, email, password, confirm, profile, touched, mode, step]);

  // After a failed submit, move focus to the first field with an error.
  useEffect(() => {
    const first = Object.keys(errors).find((k) => k !== "form" && document.getElementById(k === "linkedinUrl" ? "linkedin" : k));
    if (first && loading === false && submitted) { document.getElementById(first === "linkedinUrl" ? "linkedin" : first)?.focus(); setSubmitted(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors, submitted]);
  const pw = useMemo(() => strength(password), [password]);
  const usesPassword = mode === "signin" || mode === "signup" || mode === "reset";

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setStep(1);
    setErrors({});
    setTouched(new Set());
    router.replace(`/auth?mode=${m}`, { scroll: false });
  };

  async function post(path: string, body: unknown): Promise<{ ok: boolean; message?: string; error?: string; fieldErrors?: Record<string, string>; retryAfterSec?: number }> {
    try {
      const res = await fetch(`/api/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return await res.json();
    } catch {
      return { ok: false, error: "Could not reach the server. Check your connection." };
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErrors({});

    // 1) client-side validation (same zod schemas as the server)
    const schema = { signin: signInSchema, signup: step === 1 ? accountSchema : step === 2 ? profileStepSchema : registerSchema, magic: emailOnlySchema, forgot: emailOnlySchema, reset: resetPasswordSchema }[mode];
    const values = mode === "signup" ? { name, email, password, confirm, ...profile, whatsapp: profile.whatsapp || undefined, preferredRole: profile.preferredRole || null, pkmRole: profile.pkmRole || null } : { name, email, password, confirm };
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fe = fieldErrors(parsed.error);
      if (mode === "signup" && step === 3 && ["name", "email", "password", "confirm"].some((k) => fe[k])) {
        setStep(1);
        setErrors({ ...fe, form: "Enter your password again. We never keep passwords on this device." });
      } else setErrors(fe);
      setSubmitted(true);
      return;
    }

    if (mode === "signup" && step === 1) { setStep(2); return; }
    if (mode === "signup" && step === 2) {
      if (nimAvail === "taken") { setErrors({ nim: NIM_TAKEN }); setSubmitted(true); return; }
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) {
          setErrors({ form: mapSupabaseError(error.message) });
          return;
        }
        toast("success", "Signed in.");
        router.replace(safeNext());
        return;
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setErrors({ form: /session/i.test(error.message) ? "This link has expired. Request a new reset link." : mapSupabaseError(error.message) });
          return;
        }
        toast("success", "Password updated.");
        router.replace(safeNext());
        return;
      }

      const endpoint = { signup: "register", magic: "magic-link", forgot: "forgot-password" }[mode];
      const res = await post(endpoint, values);
      if (!res.ok) {
        if (res.fieldErrors) {
          setErrors(res.fieldErrors);
          if (mode === "signup") setStep(["name", "email", "password", "confirm"].some((k) => res.fieldErrors?.[k]) ? 1 : 2);
        }
        setErrors((p) => ({ ...p, form: res.error ?? "Something went wrong." }));
        setSubmitted(true);
        if (res.retryAfterSec) setCooldown(Math.min(res.retryAfterSec, 600));
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) {
          setErrors({ form: "Your account was created, but we could not sign you in. Try signing in." });
          return;
        }
        clearDraft(window.localStorage);
        if (cvFile) await uploadCv(cvFile).catch(() => toast("error", "Your account is ready, but the CV upload failed. Add it from your profile."));
        setDone(name.trim().split(/\s+/)[0] || "there");
        setTimeout(() => router.replace(safeNext()), 1400);
        return;
      }
      setSent({ email: email.trim().toLowerCase(), kind: mode === "magic" ? "magic" : "reset" });
      setCooldown(60);
    } finally {
      setLoading(false);
    }
  }

  async function resend(kind: Sent["kind"], to: string) {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    const path = kind === "magic" ? "magic-link" : "forgot-password";
    const res = await post(path, { email: to });
    setLoading(false);
    if (res.ok) {
      toast("success", "Email sent again.");
      setCooldown(60);
    } else {
      toast("error", res.error ?? "Could not resend the email.");
      if (res.retryAfterSec) setCooldown(Math.min(res.retryAfterSec, 600));
    }
  }

  const input = (id: string, hasErr: boolean) =>
    cn(
      "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2",
      hasErr ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20"
    ) + (id === "password" || id === "confirm" ? " pr-11" : "");

  if (done) {
    return (
      <div className="step-in py-6 text-center" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint-100 text-mint-800"><Check className="h-7 w-7" aria-hidden="true" /></span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 font-heading">Welcome, {done}</h1>
        <p className="mt-2 text-sm text-slate-600">Your account is ready. Taking you to your dashboard.</p>
      </div>
    );
  }

  // ---------- "email sent" confirmation ----------
  if (sent) {
    const label = sent.kind === "magic" ? "sign-in" : "password reset";
    return (
      <div className="text-center" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <MailCheck className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 font-heading">Check your inbox</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          If <span className="font-medium text-slate-900">{sent.email}</span> can be used, a {label} link is on its way. Check your spam folder too.
        </p>
        <button
          type="button"
          onClick={() => resend(sent.kind, sent.email)}
          disabled={cooldown > 0 || loading}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
        </button>
        <button type="button" onClick={() => { setSent(null); switchMode("signin"); }} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to sign in
        </button>
      </div>
    );
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p id={`${k}-err`} className="mt-1.5 text-xs text-rose-600">{errors[k]}</p> : null);

  return (
    <div>
      {mode === "signup" && pending && (
        <div role="region" aria-label="Saved sign-up" className="mb-5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-slate-800">
          <p className="font-medium">Continue where you left off?</p>
          <p className="mt-0.5 text-xs text-slate-600">Saved {ago(pending.savedAt)}. Your password is not saved, so you will enter it again.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => {
              setName(pending.name); setEmail(pending.email); setProfile({ ...EMPTY_PROFILE, ...pending.profile });
              setDir("fwd"); setStepRaw(pending.step); setPending(null);
            }} className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-3.5 text-xs font-medium text-white hover:bg-brand-700">Continue</button>
            <button type="button" onClick={() => { clearDraft(window.localStorage); setPending(null); setDraftState("idle"); }} className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Start over</button>
          </div>
        </div>
      )}
      {mode === "signup" && (
        <ol className="mb-5 flex items-center gap-2 text-xs font-medium" aria-label="Sign-up progress">
          {["Account", "Profile", "Review"].map((t, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const reached = step >= n;
            const body = (
              <>
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]", reached ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500")}>{step > n ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : n}</span>
                <span className={reached ? "text-slate-900" : "text-slate-500"}>{t}</span>
              </>
            );
            return (
              <li key={t} className="flex flex-1 items-center gap-2" aria-current={step === n ? "step" : undefined}>
                {step > n ? <button type="button" onClick={() => setStep(n)} className="flex items-center gap-2 rounded hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">{body}</button> : <span className="flex items-center gap-2">{body}</span>}
                {i < 2 && <span className={cn("h-px flex-1", step > n ? "bg-brand-600" : "bg-slate-200")} />}
              </li>
            );
          })}
        </ol>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">{mode === "signup" && step === 2 ? "Tell us about you" : mode === "signup" && step === 3 ? "Check your details" : copy.h}</h1>
      <p className="mt-1.5 text-sm text-slate-600">{mode === "signup" && step === 2 ? "This sets up your profile and helps us point you to the right opportunities. You can change everything later." : mode === "signup" && step === 3 ? "One last look. Use Edit to change anything before you create the account." : copy.p}</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {errors.form && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
            {errors.form}
            {cooldown > 0 && <span className="mt-1 block text-xs">Try again in {cooldown}s.</span>}
          </div>
        )}

        <div key={`${mode}-${step}`} data-dir={dir} className="step-in space-y-4">
        {mode === "signup" && step === 1 && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
            <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch("name")} placeholder="As on your student card" className={input("name", !!errors.name)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
            <Err k="name" />
          </div>
        )}

        {mode !== "reset" && !(mode === "signup" && step >= 2) && (
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => touch("email")} placeholder="you@gmail.com" className={input("email", !!errors.email)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} />
            <Err k="email" />
          </div>
        )}

        {usesPassword && !(mode === "signup" && step >= 2) && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">{mode === "reset" ? "New password" : "Password"}</label>
              {mode === "signin" && (
                <button type="button" onClick={() => switchMode("forgot")} className="text-xs font-medium text-brand-700 hover:underline">Forgot password?</button>
              )}
            </div>
            <div className="relative">
              <input id="password" type={show ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => touch("password")} placeholder={mode === "signin" ? "Your password" : "8+ characters, letters and a number"} className={input("password", !!errors.password)} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-err" : undefined} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:text-slate-600">
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
                <p className="mt-1 text-xs text-slate-500">Strength: {pw.label}</p>
              </div>
            )}
          </div>
        )}

        {(mode === "reset" || (mode === "signup" && step === 1)) && (
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-slate-700">Repeat password</label>
            <input id="confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onBlur={() => touch("confirm")} className={input("confirm", !!errors.confirm)} aria-invalid={!!errors.confirm} aria-describedby={errors.confirm ? "confirm-err" : undefined} />
            <Err k="confirm" />
          </div>
        )}

        {mode === "signup" && step === 2 && <ProfileFields value={profile} onChange={setProfile} errors={errors} onNimAvailability={setNimAvail} cv={{ label: cvFile?.name ?? null, onPick: (f) => { setCvFile(f && (f.type !== "application/pdf" || f.size > 5 * 1024 * 1024) ? null : f); setErrors((p) => ({ ...p, cv: f && (f.type !== "application/pdf" || f.size > 5 * 1024 * 1024) ? "Use a PDF of 5 MB or less." : "" })); }, error: errors.cv }} />}


        {mode === "signup" && step === 3 && (
          <div className="space-y-3">
            {([
              { n: 1 as const, title: "Account", rows: [["Name", name], ["Email", email]] },
              { n: 2 as const, title: "Profile", rows: [
                ["University", profile.institution],
                [nimLabel(profile.institution), profile.nim],
                ["Faculty", profile.faculty], ["Major", profile.major], ["Entry year", String(profile.year)],
                ["WhatsApp", profile.whatsapp],
                ["Skills", [...profile.skills, ...profile.softSkills].join(", ")],
                ["Interests", profile.interests.map((x) => labelOf(INTERESTS, x)).join(", ")],
                ["Fields", profile.fields.map((x) => labelOf(FIELDS, x)).join(", ")],
                ["Preferred role", labelOf(PREFERRED_ROLES, profile.preferredRole)],
                ["PKM role", labelOf(PKM_ROLES, profile.pkmRole)],
                ["LinkedIn", profile.linkedinUrl],
                ["CV", cvFile?.name ?? ""],
              ] },
            ]).map((sec) => (
              <section key={sec.title} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">{sec.title}</h2>
                  <button type="button" onClick={() => setStep(sec.n)} className="text-xs font-medium text-brand-700 hover:underline">Edit<span className="sr-only"> {sec.title.toLowerCase()}</span></button>
                </div>
                <dl className="mt-2 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                  {sec.rows.filter(([, v]) => v).map(([k, v]) => (<div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="break-words text-slate-900">{v}</dd></div>))}
                </dl>
              </section>
            ))}
            <p className="text-xs text-slate-500">Your password is not shown here. If you came back to a saved sign-up, you will be asked for it once more.</p>
          </div>
        )}
        </div>

        {mode === "signup" && step > 1 && (
          <button type="button" onClick={() => setStep((step - 1) as 1 | 2)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {step === 2 ? "Back to account details" : "Back to profile"}
          </button>
        )}

        <button type="submit" disabled={loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading ? "Working…" : mode === "signup" && step === 2 ? "Review" : mode === "signup" && step === 3 ? "Create account" : copy.cta}
        </button>
        {mode === "signup" && <SaveStatus state={draftState} />}
      </form>

      <div className="mt-6 space-y-3 text-center text-sm text-slate-600">
        {mode === "signin" && (
          <>
            <button type="button" onClick={() => switchMode("magic")} className="font-medium text-brand-700 hover:underline">Sign in with an email link</button>
            <p>No account yet? <button type="button" onClick={() => switchMode("signup")} className="font-medium text-brand-700 hover:underline">Create one</button></p>
          </>
        )}
        {mode === "signup" && <p>Already have an account? <button type="button" onClick={() => switchMode("signin")} className="font-medium text-brand-700 hover:underline">Sign in</button></p>}
        {(mode === "magic" || mode === "forgot") && (
          <button type="button" onClick={() => switchMode("signin")} className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to sign in
          </button>
        )}
        {mode === "reset" && <Link href="/auth?mode=signin" className="font-medium text-brand-700 hover:underline">Back to sign in</Link>}
      </div>
    </div>
  );
}
