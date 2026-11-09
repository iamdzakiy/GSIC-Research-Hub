"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { callApi } from "@/components/teams/shared";
import { btnPrimary, btnSecondary, input } from "@/components/hub/buttons";
import { COMPETITION_CATEGORIES } from "@/lib/competitions";
import { submitCompetitionSchema } from "@/lib/validation/submit-competition";
import { fieldErrors } from "@/lib/validation/auth";
import { cn } from "@/lib/cn";

const EMPTY = { title: "", organizer: "", category: "", theme: "", link: "", guidebookUrl: "", deadline: "", registrationFee: "", notes: "" };

function F({ k, label, hint, errors, children }: { k: string; label: string; hint?: string; errors: Record<string, string>; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`sc-${k}`} className="mb-1.5 block text-sm font-medium text-ink">{label}{hint && <span className="font-normal text-ink-3"> {hint}</span>}</label>
      {children}
      {errors[k] && <p className="mt-1 text-xs text-rose-600">{errors[k]}</p>}
    </div>
  );
}

export default function SubmitCompetitionForm() {
  const { user, loading } = useAuth();
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = submitCompetitionSchema.safeParse(f);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setBusy(true);
    const r = await callApi("/api/competitions/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    setBusy(false);
    if (r.ok) { setDone(true); setF(EMPTY); setErrors({}); } else setErrors({ ...(r.fieldErrors ?? {}), form: r.error });
  }

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-white" />;
  if (!user) return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <p className="font-display text-lg font-semibold text-ink">Sign in to submit</p>
      <p className="mt-1 text-sm text-ink-3">So the admins can ask you if something is unclear.</p>
      <Link href="/auth?mode=signin&next=/competitions/submit" className={cn(btnPrimary, "mt-5")}>Sign in</Link>
    </div>
  );
  if (done) return (
    <div className="pop rounded-2xl border border-mint-200 bg-mint-50 p-8 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-mint text-navy"><Check className="h-5 w-5" aria-hidden="true" /></span>
      <p className="mt-4 font-display text-lg font-semibold text-ink">Thanks, it is in the review queue</p>
      <p className="mt-1 text-sm text-ink-2">You will get a notification when it goes live.</p>
      <div className="mt-5 flex justify-center gap-2"><button type="button" onClick={() => setDone(false)} className={btnSecondary}>Submit another</button><Link href="/competitions" className={btnSecondary}>Back to competitions</Link></div>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      {errors.form && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{errors.form}</p>}
      <F errors={errors} k="title" label="Competition name"><input id="sc-title" value={f.title} onChange={set("title")} placeholder="Business Case Competition UI 2027" className={input(!!errors.title)} /></F>
      <div className="grid gap-5 sm:grid-cols-2">
        <F errors={errors} k="organizer" label="Organizer"><input id="sc-organizer" value={f.organizer} onChange={set("organizer")} placeholder="BEM FEB UI" className={input(!!errors.organizer)} /></F>
        <F errors={errors} k="category" label="Category">
          <select id="sc-category" value={f.category} onChange={set("category")} className={input(!!errors.category)}>
            <option value="">Choose one</option>
            {COMPETITION_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </F>
      </div>
      <F errors={errors} k="theme" label="Theme" hint="(optional)"><input id="sc-theme" value={f.theme} onChange={set("theme")} placeholder="Sustainable growth for Indonesian MSMEs" className={input()} /></F>
      <div className="grid gap-5 sm:grid-cols-2">
        <F errors={errors} k="deadline" label="Registration closes"><input id="sc-deadline" type="date" value={f.deadline} onChange={set("deadline")} className={input(!!errors.deadline)} /></F>
        <F errors={errors} k="registrationFee" label="Fee" hint="(optional)"><input id="sc-registrationFee" value={f.registrationFee} onChange={set("registrationFee")} placeholder="Free, or Rp150.000 per team" className={input()} /></F>
      </div>
      <F errors={errors} k="link" label="Registration or info link"><input id="sc-link" type="url" value={f.link} onChange={set("link")} placeholder="https://" className={input(!!errors.link)} /></F>
      <F errors={errors} k="guidebookUrl" label="Guidebook link" hint="(optional)"><input id="sc-guidebookUrl" type="url" value={f.guidebookUrl} onChange={set("guidebookUrl")} placeholder="https://drive.google.com/…" className={input(!!errors.guidebookUrl)} /></F>
      <F errors={errors} k="notes" label="Anything else" hint="(optional)"><textarea id="sc-notes" rows={3} maxLength={600} value={f.notes} onChange={set("notes")} className={cn(input(), "h-auto py-2.5")} /></F>
      <div className="flex justify-end border-t border-slate-100 pt-5"><button type="submit" disabled={busy} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Submit for review</button></div>
    </form>
  );
}
