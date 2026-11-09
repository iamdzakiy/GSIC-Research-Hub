"use client";
// Create a Seeking Partner post. Picking a listed competition fills the category, suggests roles for it,
// and caps the post's deadline at the competition's registration close.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/components/teams/shared";
import { btnPrimary, btnSecondary, chip, input } from "@/components/hub/buttons";
import { categoryLabel, rolesFor, wibDate } from "@/lib/competitions";
import { createCallSchema } from "@/lib/validation/teams";
import { fieldErrors } from "@/lib/validation/auth";
import { cn } from "@/lib/cn";

interface Comp { id: string; slug: string; title: string; deadline: string; category: string | null }
type Kind = "team_needs_member" | "looking_for_team";
const COMMITMENTS = ["A few hours a week", "Weekends", "Intensive near the deadline", "Full sprint until submission"];

const ymd = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

export default function PartnerForm() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [comps, setComps] = useState<Comp[]>([]);
  const [kind, setKind] = useState<Kind>(params.get("kind") === "looking_for_team" ? "looking_for_team" : "team_needs_member");
  const [f, setF] = useState({ title: "", competition: "", opportunityId: "", slots: "1", currentTeamSize: "", commitment: "", description: "", deadline: "" });
  const [roles, setRoles] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [draftRole, setDraftRole] = useState("");
  const [draftSkill, setDraftSkill] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch("/api/opportunities?type=competition&pageSize=100").then((r) => (r.ok ? r.json() : null)).then((b) => {
      const now = Date.now();
      const list = ((b?.opportunities ?? []) as Comp[]).filter((o) => new Date(o.deadline).getTime() > now);
      setComps(list);
      const pre = params.get("competition");
      const hit = list.find((o) => o.id === pre || o.slug === pre);
      if (hit) pick(hit);
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comp = comps.find((c) => c.id === f.opportunityId);
  const suggestions = useMemo(() => rolesFor(comp?.category).filter((r) => !roles.includes(r)), [comp, roles]);
  const max = comp ? ymd(new Date(comp.deadline)) : undefined;

  function pick(c?: Comp) {
    setF((p) => ({ ...p, opportunityId: c?.id ?? "", competition: c?.title ?? p.competition, deadline: c ? ymd(new Date(c.deadline)) : p.deadline }));
  }
  const add = (list: string[], setList: (v: string[]) => void, v: string, limit: number) => {
    const t = v.trim();
    if (t && !list.some((x) => x.toLowerCase() === t.toLowerCase()) && list.length < limit) setList([...list, t]);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...f, kind, opportunityId: f.opportunityId || null, rolesNeeded: roles, skillsNeeded: skills, interests: [],
      currentTeamSize: f.currentTeamSize || null, commitment: f.commitment || null,
      slots: kind === "looking_for_team" ? "1" : f.slots,
      deadline: f.deadline ? `${f.deadline}T23:59:00+07:00` : "",
    };
    const parsed = createCallSchema.safeParse(payload);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setBusy(true);
    const r = await callApi<{ id: string }>("/api/teams/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBusy(false);
    if (r.ok) { toast("success", "Your post is live."); return router.push(`/partners/${r.data.id}`); }
    setErrors({ ...(r.fieldErrors ?? {}), form: r.error });
  }

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-white" />;
  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="font-display text-xl font-semibold text-ink">Sign in to post</h2>
        <p className="mt-1 text-sm text-ink-3">Anyone can read posts. Posting and responding need an account so people know who they are talking to.</p>
        <Link href="/auth?mode=signin&next=/partners/new" className={cn(btnPrimary, "mt-5")}>Sign in</Link>
      </div>
    );
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-xs text-rose-600">{errors[k]}</p> : null);
  const L = ({ htmlFor, children, hint }: { htmlFor?: string; children: React.ReactNode; hint?: string }) => (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">{children}{hint && <span className="font-normal text-ink-3"> {hint}</span>}</label>
  );
  const lft = kind === "looking_for_team";

  return (
    <form onSubmit={submit} noValidate className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      {!userProfile?.linkedinUrl && (
        <p role="status" className="rounded-lg border border-cream-300 bg-cream-100 px-4 py-3 text-sm text-navy">Add your LinkedIn on <Link href="/settings" className="font-medium underline">settings</Link> first. People check it before they respond.</p>
      )}
      {errors.form && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errors.form}</p>}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">What are you posting?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {([["team_needs_member", "My team needs people", "You have a team and open roles."], ["looking_for_team", "I am looking for a team", "You bring a role and want to join one."]] as const).map(([id, t, d]) => (
            <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}
              className={cn("rounded-xl border p-4 text-left transition-colors", kind === id ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-slate-300 hover:border-slate-400")}>
              <span className="block font-semibold text-ink">{t}</span><span className="mt-0.5 block text-sm text-ink-3">{d}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <L htmlFor="pf-comp" hint="(listed on the hub, or type a name)">Competition</L>
        <select id="pf-comp" value={f.opportunityId} onChange={(e) => pick(comps.find((c) => c.id === e.target.value))} className={cn(input(), "mb-2")}>
          <option value="">Not listed on GSIC Hub</option>
          {comps.map((c) => <option key={c.id} value={c.id}>{c.title} · closes {wibDate(new Date(c.deadline))}</option>)}
        </select>
        {!f.opportunityId && <input aria-label="Competition name" value={f.competition} onChange={(e) => set("competition", e.target.value)} placeholder="Shopee Code League 2027" aria-invalid={!!errors.competition} className={input(!!errors.competition)} />}
        {comp?.category && <p className="mt-1.5 text-xs text-ink-3">Category: {categoryLabel(comp.category)}. Your post closes no later than this competition&apos;s registration.</p>}
        <Err k="competition" />
      </div>

      <div>
        <L htmlFor="pf-title">Title</L>
        <input id="pf-title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={lft ? "Data analyst looking for a BCC team" : "Need a financial modeler and a slide designer"} aria-invalid={!!errors.title} className={input(!!errors.title)} />
        <Err k="title" />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">{lft ? "Roles you can take" : "Roles you need"} <span className="font-normal text-ink-3">(up to 4)</span></legend>
        <ul className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <li key={r}><button type="button" onClick={() => setRoles(roles.filter((x) => x !== r))} className={chip(true)} aria-label={`Remove ${r}`}>{r}<X className="h-3.5 w-3.5" aria-hidden="true" /></button></li>
          ))}
          {roles.length < 4 && suggestions.slice(0, 6).map((r) => (
            <li key={r}><button type="button" onClick={() => setRoles([...roles, r])} className={chip(false)}><Plus className="h-3.5 w-3.5" aria-hidden="true" />{r}</button></li>
          ))}
        </ul>
        {roles.length < 4 && (
          <div className="mt-2 flex gap-2">
            <input aria-label="Custom role" value={draftRole} onChange={(e) => setDraftRole(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(roles, setRoles, draftRole, 4); setDraftRole(""); } }} placeholder="Another role" maxLength={40} className={cn(input(), "h-10")} />
            <button type="button" onClick={() => { add(roles, setRoles, draftRole, 4); setDraftRole(""); }} className={cn(btnSecondary, "h-10")}>Add</button>
          </div>
        )}
        <Err k="rolesNeeded" />
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">{lft ? "Skills you bring" : "Skills that help"} <span className="font-normal text-ink-3">(optional, up to 8)</span></legend>
        {skills.length > 0 && <ul className="mb-2 flex flex-wrap gap-2">{skills.map((s) => <li key={s}><button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className={chip(true)} aria-label={`Remove ${s}`}>{s}<X className="h-3.5 w-3.5" aria-hidden="true" /></button></li>)}</ul>}
        <div className="flex gap-2">
          <input aria-label="Skill" value={draftSkill} onChange={(e) => setDraftSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(skills, setSkills, draftSkill, 8); setDraftSkill(""); } }} placeholder="Excel, Figma, Python, public speaking" maxLength={30} className={cn(input(), "h-10")} />
          <button type="button" onClick={() => { add(skills, setSkills, draftSkill, 8); setDraftSkill(""); }} className={cn(btnSecondary, "h-10")}>Add</button>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        {!lft && (
          <>
            <div><L htmlFor="pf-size">Team now</L><input id="pf-size" type="number" min={1} max={10} value={f.currentTeamSize} onChange={(e) => set("currentTeamSize", e.target.value)} placeholder="2" className={input()} /></div>
            <div><L htmlFor="pf-slots">Open slots</L><input id="pf-slots" type="number" min={1} max={10} value={f.slots} onChange={(e) => set("slots", e.target.value)} aria-invalid={!!errors.slots} className={input(!!errors.slots)} /><Err k="slots" /></div>
          </>
        )}
        <div>
          <L htmlFor="pf-deadline">Respond by</L>
          <input id="pf-deadline" type="date" max={max} value={f.deadline} onChange={(e) => set("deadline", e.target.value)} aria-invalid={!!errors.deadline} className={input(!!errors.deadline)} />
          <Err k="deadline" />
        </div>
      </div>

      <div>
        <L htmlFor="pf-commit">Commitment</L>
        <input id="pf-commit" list="pf-commit-list" value={f.commitment} onChange={(e) => set("commitment", e.target.value)} placeholder="A few hours a week" maxLength={60} className={input()} />
        <datalist id="pf-commit-list">{COMMITMENTS.map((c) => <option key={c} value={c} />)}</datalist>
      </div>

      <div>
        <L htmlFor="pf-desc" hint={`(${f.description.length}/600)`}>{lft ? "About you and what you want to work on" : "What you are building and what each role will do"}</L>
        <textarea id="pf-desc" rows={5} maxLength={600} value={f.description} onChange={(e) => set("description", e.target.value)} aria-invalid={!!errors.description} className={cn(input(!!errors.description), "h-auto py-2.5")} />
        <Err k="description" />
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
        <Link href="/partners" className={btnSecondary}>Cancel</Link>
        <button type="submit" disabled={busy} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? "Posting" : "Publish post"}</button>
      </div>
    </form>
  );
}
