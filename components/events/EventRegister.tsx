"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/cn";
import { BOOTCAMP_SCHEMES, bootcampAnswers, sandboxAnswers } from "@/lib/validation/events";
import { fieldErrors } from "@/lib/validation/auth";

interface Props {
  event: { id: string; slug: string; type: string; title: string; mode: string };
  closedReason: string | null;
}
interface Access { signedIn: boolean; registered: boolean; meetingUrl: string | null }

const field = (err?: string) => cn("w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2", err ? "border-rose-400 focus:ring-rose-500/20" : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20");

export default function EventRegister({ event, closedReason }: Props) {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [access, setAccess] = useState<Access | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hope, setHope] = useState("");
  const [scheme, setScheme] = useState("");
  const [needsTeam, setNeedsTeam] = useState(false);
  const [members, setMembers] = useState("");
  const [lecturer, setLecturer] = useState("");
  const bootcamp = event.type === "bootcamp";

  const loadAccess = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/events/${event.slug}`);
      const b = await res.json().catch(() => null);
      setAccess(res.ok && b?.ok ? b : { signedIn: !!user, registered: false, meetingUrl: null });
    } catch {
      setAccess({ signedIn: !!user, registered: false, meetingUrl: null });
    }
  }, [event.slug, user]);

  useEffect(() => { if (!loading) void loadAccess(); }, [loading, loadAccess]);

  const missing = [!userProfile?.name && "name", !userProfile?.faculty && "faculty", !userProfile?.major && "major", !userProfile?.linkedinUrl && "LinkedIn"].filter(Boolean) as string[];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const teamMembers = members.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
    const answers = bootcamp ? { scheme, needsTeam, teamMembers: needsTeam ? [] : teamMembers, lecturer: lecturer || undefined } : { hope: hope || undefined };
    const parsed = (bootcamp ? bootcampAnswers : sandboxAnswers).safeParse(answers);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    try {
      const res = await apiFetch("/api/registrations", { method: "POST", body: JSON.stringify({ eventId: event.id, answers }) });
      const b = await res.json().catch(() => null);
      if (!res.ok || b?.ok === false) return setErrors({ ...(b?.fieldErrors ?? {}), form: b?.error ?? "Could not register." });
      toast("success", "You are registered. A confirmation email is on its way.");
      await loadAccess();
    } catch {
      setErrors({ form: "Could not reach the server. Check your connection." });
    } finally {
      setBusy(false);
    }
  }

  const card = "rounded-xl border border-slate-200 bg-white p-5";
  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1.5 text-xs text-rose-600">{errors[k]}</p> : null);
  const teamsHref = `/teams?event=${encodeURIComponent(event.slug)}&tab=open`;

  if (loading || !access) return <div className={card} aria-busy="true"><div className="h-6 w-1/2 animate-pulse rounded bg-slate-100" /><div className="mt-4 h-10 animate-pulse rounded bg-slate-100" /></div>;

  if (access.registered) {
    return (
      <div className={card} role="status">
        <p className="flex items-center gap-2 font-semibold text-slate-900"><Check className="h-5 w-5 rounded-full bg-mint p-0.5 text-navy" aria-hidden="true" /> Anda sudah terdaftar</p>
        {access.meetingUrl ? (
          <a href={access.meetingUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700">
            Buka tautan Zoom <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : event.mode !== "onsite" ? <p className="mt-3 text-sm text-slate-600">Tautan Zoom akan muncul di sini begitu panitia mengunggahnya.</p> : null}
        <Link href="/dashboard" className="mt-3 block text-sm font-medium text-brand-700 hover:underline">Lihat di dasbor</Link>
        {bootcamp && <Link href={teamsHref} className="mt-2 block text-sm font-medium text-brand-700 hover:underline">Find teammates</Link>}
      </div>
    );
  }

  if (closedReason) return <div className={card}><p className="font-semibold text-slate-900">{closedReason}</p>{bootcamp && <Link href={teamsHref} className="mt-3 block text-sm font-medium text-brand-700 hover:underline">Find teammates</Link>}</div>;

  if (!user) {
    return (
      <div className={card}>
        <p className="font-semibold text-slate-900">Daftar untuk acara ini</p>
        <p className="mt-1 text-sm text-slate-600">Masuk dulu, lalu daftar dengan satu ketukan.</p>
        <Link href={`/auth?mode=signin&next=/events/${event.slug}`} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700">Sign in</Link>
        <Link href={`/auth?mode=signup&next=/events/${event.slug}`} className="mt-2 block text-center text-sm font-medium text-brand-700 hover:underline">Buat akun</Link>
      </div>
    );
  }

  if (missing.length) {
    return (
      <div className={card}>
        <p className="font-semibold text-slate-900">Lengkapi profil dulu</p>
        <p className="mt-1 text-sm text-slate-600">Yang masih kosong: {missing.join(", ")}.</p>
        <Link href="/dashboard" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700">Buka profil</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={card}>
      <p className="font-semibold text-slate-900">Daftar</p>
      {errors.form && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errors.form}</p>}

      {bootcamp ? (
        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Skema PKM</legend>
            <div className="grid grid-cols-2 gap-2">
              {BOOTCAMP_SCHEMES.map((s) => (
                <button key={s} type="button" aria-pressed={scheme === s} onClick={() => setScheme(s)} className={cn("h-10 rounded-lg border text-sm font-medium transition-colors", scheme === s ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-brand-400")}>{s}</button>
              ))}
            </div>
            <Err k="scheme" />
          </fieldset>
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={needsTeam} onChange={(e) => setNeedsTeam(e.target.checked)} className="h-4 w-4 accent-[#3352CD]" /> Saya butuh tim</label>
            {needsTeam && <p className="mt-2 text-sm text-slate-600">Setelah mendaftar, <Link href={teamsHref} className="font-medium text-brand-700 underline">cari teman satu tim</Link>.</p>}
          </div>
          {!needsTeam && (
            <div>
              <label htmlFor="ev-members" className="mb-1.5 block text-sm font-medium text-slate-700">Email ITB anggota tim</label>
              <textarea id="ev-members" rows={3} value={members} onChange={(e) => setMembers(e.target.value)} placeholder="satu per baris, maksimal 4" aria-invalid={!!errors.teamMembers} className={cn(field(errors.teamMembers), "py-2.5")} />
              <Err k="teamMembers" />
            </div>
          )}
          <div>
            <label htmlFor="ev-lect" className="mb-1.5 block text-sm font-medium text-slate-700">Dosen pembimbing <span className="font-normal text-slate-400">(opsional)</span></label>
            <input id="ev-lect" value={lecturer} onChange={(e) => setLecturer(e.target.value)} className={cn(field(errors.lecturer), "h-11")} />
            <Err k="lecturer" />
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <label htmlFor="ev-hope" className="mb-1.5 block text-sm font-medium text-slate-700">Apa yang ingin Anda dapat? <span className="font-normal text-slate-400">(opsional, {hope.length}/300)</span></label>
          <textarea id="ev-hope" rows={3} maxLength={300} value={hope} onChange={(e) => setHope(e.target.value)} className={cn(field(errors.hope), "py-2.5")} />
          <Err k="hope" />
        </div>
      )}

      <button type="submit" disabled={busy} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? "Mendaftar…" : "Daftar sekarang"}
      </button>
      {bootcamp && !needsTeam && <Link href={teamsHref} className="mt-3 block text-center text-sm font-medium text-brand-700 hover:underline">Find teammates</Link>}
    </form>
  );
}
