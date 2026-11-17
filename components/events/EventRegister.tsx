"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useNimGate } from "@/components/portal/NimGate";
import TeamMembers, { type MemberRow } from "@/components/events/TeamMembers";
import SaveStatus from "@/components/motion/SaveStatus";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/cn";
import { savedAgo } from "@/lib/form-draft";
import { useFormDraft } from "@/lib/hooks/useFormDraft";
import { nimError } from "@/lib/nim";
import { BOOTCAMP_SCHEMES, bootcampAnswers, registrationDraftSchema, sandboxAnswers, type RegistrationDraft } from "@/lib/validation/events";
import { fieldErrors } from "@/lib/validation/auth";

interface Props {
  event: { id: string; slug: string; type: string; title: string; mode: string; comingSoon?: boolean };
  closedReason: string | null;
  /** Full events take a waitlist place instead of a seat. */
  full?: boolean;
  /** Set once an admin marked the event completed. */
  completed?: { recap: string | null } | null;
}
interface Reg { id: string; status: string; details: Record<string, unknown> | null; canEdit: boolean }
interface Access { signedIn: boolean; registered: boolean; waitlisted?: boolean; position?: number | null; interested?: boolean; meetingUrl: string | null; registration?: Reg | null }

const field = (err?: string) => cn("w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2", err ? "border-rose-400 focus:ring-rose-500/20" : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20");
const EMPTY: RegistrationDraft = { scheme: "" as never, needsTeam: false, members: [], lecturer: "", hope: "" };
const STEPS = ["Datamu", "Pertanyaan", "Tinjau"] as const;

function fromDetails(d: Record<string, unknown> | null): RegistrationDraft {
  const tm = Array.isArray(d?.teamMembers) ? (d!.teamMembers as { nim?: string; name?: string; email?: string | null }[]) : [];
  return {
    scheme: (typeof d?.scheme === "string" ? d.scheme : "") as never, needsTeam: d?.needsTeam === true,
    members: tm.map((m) => ({ nim: m.nim ?? "", name: m.name ?? "", email: m.email ?? "" })),
    lecturer: typeof d?.lecturer === "string" ? d.lecturer : "", hope: typeof d?.hope === "string" ? d.hope : "",
  };
}

export default function EventRegister({ event, closedReason, full = false, completed = null }: Props) {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const nimGate = useNimGate();
  const [access, setAccess] = useState<Access | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<RegistrationDraft>(EMPTY);
  const [step, setStepRaw] = useState(1);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [justDone, setJustDone] = useState<"confirmed" | "waitlisted" | null>(null);
  const bootcamp = event.type === "bootcamp";
  const draft = useFormDraft<RegistrationDraft>(`event:${event.slug}`, registrationDraftSchema);
  const applied = useRef(false);

  const setStep = (n: number) => { setDir(n < step ? "back" : "fwd"); setStepRaw(n); if (!editing && applied.current && JSON.stringify(form) !== JSON.stringify(EMPTY)) draft.save(form, n); };

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

  // Apply a restored draft once, and only for a new registration (never over an edit).
  useEffect(() => {
    if (!draft.ready || applied.current) return;
    applied.current = true;
    if (draft.initial) { setForm({ ...EMPTY, ...draft.initial } as RegistrationDraft); setStepRaw(Math.min(3, Math.max(1, draft.initialStep))); }
  }, [draft.ready, draft.initial, draft.initialStep]);

  const update = (patch: Partial<RegistrationDraft>, nextStep = step) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (!editing) draft.save(next, nextStep);
  };

  const missing = [!userProfile?.name && "name", !userProfile?.faculty && "faculty", !userProfile?.major && "major", !userProfile?.linkedinUrl && "LinkedIn"].filter(Boolean) as string[];
  const answers = useMemo(() => bootcamp
    ? { scheme: form.scheme, needsTeam: form.needsTeam, teamMembers: form.needsTeam ? [] : form.members.map((m) => ({ nim: m.nim, name: m.name || undefined, email: m.email || undefined })), lecturer: form.lecturer || undefined }
    : { hope: form.hope || undefined }, [bootcamp, form]);

  function validate(): Record<string, string> {
    const parsed = (bootcamp ? bootcampAnswers : sandboxAnswers).safeParse(answers);
    return parsed.success ? {} : fieldErrors(parsed.error);
  }

  function next(e?: React.FormEvent) {
    e?.preventDefault();
    if (step === 1) { setStep(2); return; }
    if (step === 2) { const v = validate(); setErrors(v); if (Object.keys(v).length) return; setStep(3); return; }
    void submit();
  }

  async function submit() {
    if (busy) return;
    if (!(await nimGate.ensureNim())) return;
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); setStep(2); return; }
    setErrors({});
    setBusy(true);
    try {
      const url = editing && access?.registration ? `/api/registrations/${access.registration.id}` : "/api/registrations";
      const res = await apiFetch(url, { method: editing ? "PUT" : "POST", body: JSON.stringify({ eventId: event.id, answers }) });
      const b = await res.json().catch(() => null);
      if (!res.ok || b?.ok === false) { setErrors({ ...(b?.fieldErrors ?? {}), form: b?.error ?? "Could not register." }); if (b?.fieldErrors) setStep(2); return; }
      await draft.clear();
      if (editing) { toast("success", "Perubahan tersimpan."); setEditing(false); }
      else { setJustDone(b?.status === "waitlisted" ? "waitlisted" : "confirmed"); toast("success", b?.status === "waitlisted" ? "Kamu masuk daftar tunggu." : "You are registered. A confirmation email is on its way."); }
      await loadAccess();
    } catch {
      setErrors({ form: "Could not reach the server. Check your connection." });
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!access?.registration || busy) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/registrations/${access.registration.id}`, { method: "DELETE" });
      const b = await res.json().catch(() => null);
      if (!res.ok || b?.ok === false) { toast("error", b?.error ?? "Could not cancel."); return; }
      toast("success", "Pendaftaran dibatalkan.");
      setConfirmCancel(false); setJustDone(null); setForm(EMPTY); setStepRaw(1);
      await loadAccess();
    } finally { setBusy(false); }
  }

  const card = "rounded-xl border border-slate-200 bg-white p-5";
  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1.5 text-xs text-rose-600">{errors[k]}</p> : null);
  const teamsHref = `/partners?event=${encodeURIComponent(event.slug)}`;

  if (loading || !access) return <div className={card} aria-busy="true"><div className="h-6 w-1/2 animate-pulse rounded bg-slate-100" /><div className="mt-4 h-10 animate-pulse rounded bg-slate-100" /></div>;

  if (event.comingSoon) {
    const toggle = async () => {
      if (!user) return;
      setBusy(true);
      try {
        const res = await apiFetch(`/api/events/${event.slug}/interest`, { method: access.interested ? "DELETE" : "POST" });
        if (res.ok) { setAccess({ ...access, interested: !access.interested }); toast("success", access.interested ? "We will not email you about this one." : "Done. We will email you when registration opens."); }
        else toast("error", "Could not save. Try again.");
      } finally { setBusy(false); }
    };
    return (
      <div className={card}>
        <p className="label-mono text-brand-700">Segera hadir</p>
        <p className="mt-2 font-display text-lg font-semibold text-ink">Pendaftaran belum dibuka</p>
        <p className="mt-1 text-sm leading-6 text-ink-3">Jadwal dan detailnya sedang disiapkan. Tekan tombol di bawah, kami kirim email begitu pendaftaran dibuka.</p>
        {user ? (
          <button type="button" onClick={toggle} disabled={busy} aria-pressed={!!access.interested}
            className={cn("mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors", access.interested ? "border border-mint-600 bg-mint-50 text-mint-800" : "bg-brand-600 text-white hover:bg-brand-700")}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : access.interested ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
            {access.interested ? "Kami akan mengabari Anda" : "Kabari saya"}
          </button>
        ) : (
          <Link href={`/auth?mode=signin&next=/events/${event.slug}`} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700">Masuk untuk dikabari</Link>
        )}
      </div>
    );
  }

  if (completed) {
    return (
      <div className={card} lang="id">
        <p className="label-mono text-brand-700">Selesai</p>
        <p className="mt-2 font-display text-lg font-semibold text-ink">Acara ini sudah selesai</p>
        {completed.recap && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-2">{completed.recap}</p>}
        <Link href="/events" className="mt-4 block text-sm font-medium text-brand-700 hover:underline">Lihat program lain</Link>
      </div>
    );
  }

  if (access.registration && !editing) {
    const waitlisted = access.registration.status === "waitlisted";
    return (
      <div className={card} role="status" lang="id">
        <p className="flex items-center gap-2 font-semibold text-slate-900"><Check className="h-5 w-5 rounded-full bg-mint p-0.5 text-navy" aria-hidden="true" />{waitlisted ? `Kamu di daftar tunggu${access.position ? `, urutan ${access.position}` : ""}` : "Anda sudah terdaftar"}</p>
        {waitlisted && <p className="mt-2 text-sm text-slate-600">Kalau ada yang mundur, kamu naik otomatis dan kami kabari lewat notifikasi dan email.</p>}
        {justDone === "confirmed" && <p className="mt-2 text-sm text-slate-600">Langkah berikutnya: pra-tes akan muncul di dasbor begitu panitia membukanya.</p>}
        {access.meetingUrl ? (
          <a href={access.meetingUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700">
            Buka tautan Zoom <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : !waitlisted && event.mode !== "onsite" ? <p className="mt-3 text-sm text-slate-600">Tautan Zoom akan muncul di sini begitu panitia mengunggahnya.</p> : null}
        <Link href="/dashboard" className="mt-3 block text-sm font-medium text-brand-700 hover:underline">Lihat di dasbor</Link>
        {bootcamp && <Link href={teamsHref} className="mt-2 block text-sm font-medium text-brand-700 hover:underline">Cari partner</Link>}
        {access.registration.canEdit && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-4 text-sm">
            <button type="button" onClick={() => { setForm(fromDetails(access.registration!.details)); setStepRaw(2); setEditing(true); }} className="font-medium text-brand-700 hover:underline">Ubah pendaftaran</button>
            {!confirmCancel ? <button type="button" onClick={() => setConfirmCancel(true)} className="font-medium text-rose-700 hover:underline">Batalkan</button> : (
              <span className="flex items-center gap-2">
                <span className="text-slate-700">Yakin?</span>
                <button type="button" onClick={cancel} disabled={busy} className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60">Ya, batalkan</button>
                <button type="button" onClick={() => setConfirmCancel(false)} className="text-xs font-medium text-slate-600 hover:underline">Tidak</button>
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (closedReason && !editing) return <div className={card}><p className="font-semibold text-slate-900">{closedReason}</p>{bootcamp && <Link href={teamsHref} className="mt-3 block text-sm font-medium text-brand-700 hover:underline">Cari partner</Link>}</div>;

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

  const profileRows: [string, string][] = [
    ["Nama", userProfile?.name ?? ""], ["NIM", userProfile?.nim ?? ""], ["Fakultas", userProfile?.faculty ?? ""], ["Jurusan", userProfile?.major ?? ""],
    ["WhatsApp", userProfile?.whatsapp ?? ""], ["Email", user.email ?? ""],
  ];
  const ownNim = userProfile?.nim ?? null;
  const memberErr = form.members.some((m) => m.nim && nimError("ITB", m.nim)) ? "Periksa NIM anggota." : errors.teamMembers;

  return (
    <form onSubmit={next} noValidate className={card} lang="id">
      {nimGate.sheet}
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900">{editing ? "Ubah pendaftaran" : full ? "Daftar tunggu" : "Daftar"}</p>
        <span className="text-xs text-slate-500">Langkah {step} dari 3</span>
      </div>
      <ol className="mt-3 flex gap-1.5" aria-label="Langkah pendaftaran">
        {STEPS.map((t, i) => (
          <li key={t} className="flex-1" aria-current={step === i + 1 ? "step" : undefined}>
            {step > i + 1 ? <button type="button" onClick={() => setStep(i + 1)} className="block w-full text-left"><span className="block h-1 rounded-full bg-brand-600" /><span className="mt-1 block text-[11px] font-medium text-brand-700">{t}</span></button>
              : <><span className={cn("block h-1 rounded-full", step === i + 1 ? "bg-brand-600" : "bg-slate-200")} /><span className={cn("mt-1 block text-[11px] font-medium", step === i + 1 ? "text-slate-900" : "text-slate-500")}>{t}</span></>}
          </li>
        ))}
      </ol>
      {full && !editing && <p className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-xs text-slate-700">Kuota penuh. Kamu masuk daftar tunggu dan naik otomatis kalau ada yang mundur.</p>}
      {!editing && draft.restored && step > 0 && <p className="mt-3 text-xs text-slate-500">Draf dipulihkan ({savedAgo(draft.restored.savedAt)}).</p>}
      {errors.form && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errors.form}</p>}

      <div key={step} data-dir={dir} className="step-in mt-4">
        {step === 1 && (
          <div>
            <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1.5 text-sm">
              {profileRows.filter(([, v]) => v).map(([k, v]) => (<div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="break-words text-slate-900">{v}</dd></div>))}
            </dl>
            {!ownNim && <p className="mt-3 text-sm text-rose-700">NIM belum diisi. Kami minta saat kamu menekan tombol daftar.</p>}
            <p className="mt-3 text-xs text-slate-500">Data ini diambil dari profilmu, jadi tidak perlu mengetik ulang. <Link href="/settings" className="font-medium text-brand-700 underline">Edit profile</Link></p>
          </div>
        )}

        {step === 2 && (bootcamp ? (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-slate-700">Skema PKM</legend>
              <div className="grid grid-cols-2 gap-2">
                {BOOTCAMP_SCHEMES.map((sc) => (
                  <button key={sc} type="button" aria-pressed={form.scheme === sc} onClick={() => update({ scheme: sc })} className={cn("h-10 rounded-lg border text-sm font-medium transition-colors", form.scheme === sc ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-brand-400")}>{sc}</button>
                ))}
              </div>
              {errors.scheme && <p className="mt-1.5 text-xs text-rose-600">{errors.scheme}</p>}
            </fieldset>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.needsTeam} onChange={(e) => update({ needsTeam: e.target.checked })} className="h-4 w-4 accent-brand-600" /> Saya butuh tim</label>
              {form.needsTeam && <p className="mt-2 text-sm text-slate-600">Setelah mendaftar, <Link href={teamsHref} className="font-medium text-brand-700 underline">cari teman satu tim</Link>.</p>}
            </div>
            {!form.needsTeam && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Anggota tim (maksimal 4)</p>
                <TeamMembers rows={form.members as MemberRow[]} onChange={(members) => update({ members })} ownNim={ownNim} error={memberErr} />
              </div>
            )}
            <div>
              <label htmlFor="ev-lect" className="mb-1.5 block text-sm font-medium text-slate-700">Dosen pembimbing <span className="font-normal text-slate-500">(opsional)</span></label>
              <input id="ev-lect" value={form.lecturer} onChange={(e) => update({ lecturer: e.target.value })} className={cn(field(errors.lecturer), "h-11")} />
              {errors.lecturer && <p className="mt-1.5 text-xs text-rose-600">{errors.lecturer}</p>}
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="ev-hope" className="mb-1.5 block text-sm font-medium text-slate-700">Apa yang ingin Anda dapat? <span className="font-normal text-slate-500">(opsional, {form.hope.length}/300)</span></label>
            <textarea id="ev-hope" rows={3} maxLength={300} value={form.hope} onChange={(e) => update({ hope: e.target.value })} className={cn(field(errors.hope), "py-2.5")} />
            {errors.hope && <p className="mt-1.5 text-xs text-rose-600">{errors.hope}</p>}
          </div>
        ))}

        {step === 3 && (
          <div className="space-y-3 text-sm">
            <section className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">Datamu</h3><button type="button" onClick={() => setStep(1)} className="text-xs font-medium text-brand-700 hover:underline">Edit<span className="sr-only"> datamu</span></button></div>
              <p className="mt-1 text-slate-700">{[userProfile?.name, ownNim, userProfile?.major].filter(Boolean).join(" · ")}</p>
            </section>
            <section className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">Pertanyaan</h3><button type="button" onClick={() => setStep(2)} className="text-xs font-medium text-brand-700 hover:underline">Edit<span className="sr-only"> pertanyaan</span></button></div>
              {bootcamp ? (
                <dl className="mt-1 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-slate-700">
                  <dt className="text-slate-500">Skema</dt><dd>{form.scheme}</dd>
                  <dt className="text-slate-500">Tim</dt><dd>{form.needsTeam ? "Butuh tim" : form.members.map((m) => m.nim).join(", ") || "-"}</dd>
                  {form.lecturer && <><dt className="text-slate-500">Dosen</dt><dd>{form.lecturer}</dd></>}
                </dl>
              ) : <p className="mt-1 text-slate-700">{form.hope || "Tidak diisi"}</p>}
            </section>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2">
        {step > 1 && <button type="button" onClick={() => setStep(step - 1)} aria-label="Kembali" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>}
        <button type="submit" disabled={busy} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? "Menyimpan…" : step < 3 ? "Lanjut" : editing ? "Simpan perubahan" : full ? "Masuk daftar tunggu" : "Daftar sekarang"}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {editing ? <button type="button" onClick={() => { setEditing(false); setForm(EMPTY); setStepRaw(1); }} className="text-xs font-medium text-slate-600 hover:underline">Batal mengubah</button> : <SaveStatus state={draft.status} />}
        {bootcamp && !form.needsTeam && step === 2 && <Link href={teamsHref} className="text-xs font-medium text-brand-700 hover:underline">Cari partner</Link>}
      </div>
    </form>
  );
}
