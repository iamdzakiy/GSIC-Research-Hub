"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ui/Toast";
import ProfileFields, { EMPTY_PROFILE, type ProfileValues } from "@/components/portal/ProfileFields";
import AvatarPicker from "@/components/settings/AvatarPicker";
import { btnPrimary, btnSecondary, chip, input } from "@/components/hub/buttons";
import { callApi } from "@/components/teams/shared";
import { deleteAccount, removeCv, updateUserProfile, uploadAvatar, uploadCv } from "@/services/userService";
import { COMPETITION_CATEGORIES } from "@/lib/competitions";
import { NOTIFY_KINDS } from "@/lib/notify-kinds";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/cn";

const NAV = [["profile", "Profile"], ["photo", "Photo"], ["hub", "Hub profile"], ["notifications", "Email"], ["account", "Account"]] as const;
type Ach = { title: string; year?: number; result?: string };

function Card({ id, title, note, children }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      {note && <p className="mt-1 text-sm text-ink-3">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span><span className="block text-sm font-medium text-ink">{label}</span>{hint && <span className="mt-0.5 block text-xs text-ink-3">{hint}</span>}</span>
      <span className="relative mt-0.5 shrink-0">
        <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export default function SettingsClient() {
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [values, setValues] = useState<ProfileValues>(EMPTY_PROFILE);
  const [hub, setHub] = useState({ username: "", headline: "", portfolioUrl: "", githubUrl: "", openToTeam: true, directoryVisible: true, competitionInterests: [] as string[] });
  const [ach, setAch] = useState<Ach[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState("");
  const [prefs, setPrefs] = useState<Record<string, boolean> | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (!userProfile) return;
    const u = userProfile;
    setName(u.name ?? ""); setBio(u.bio ?? "");
    setValues({ faculty: u.faculty ?? "", major: u.major ?? "", year: u.year ?? new Date().getFullYear(), whatsapp: u.whatsapp ?? "", skills: u.skills ?? [], softSkills: u.softSkills ?? [],
      interests: u.interests ?? [], linkedinUrl: u.linkedinUrl ?? "", preferredRole: u.preferredRole ?? "", pkmRole: u.pkmRole ?? "", fields: u.fields ?? [], institution: u.institution ?? "ITB" });
    setHub({ username: u.username ?? "", headline: u.headline ?? "", portfolioUrl: u.portfolioUrl ?? "", githubUrl: u.githubUrl ?? "", openToTeam: u.openToTeam ?? true, directoryVisible: u.directoryVisible ?? true, competitionInterests: u.competitionInterests ?? [] });
    setAch(u.achievements ?? []);
  }, [userProfile]);
  useEffect(() => {
    if (!user) return;
    void callApi<{ prefs: Record<string, boolean>; isAdmin: boolean }>("/api/me/notify-prefs").then((r) => { if (r.ok) { setPrefs(r.data.prefs); setIsAdmin(r.data.isAdmin); } });
  }, [user]);

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-white" />;
  if (!user || !userProfile) return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <p className="font-display text-lg font-semibold text-ink">Sign in to edit your settings</p>
      <Link href="/auth?mode=signin&next=/settings" className={cn(btnPrimary, "mt-5")}>Sign in</Link>
    </div>
  );

  async function save(section: string, patch: Record<string, unknown>) {
    if (!user) return;
    setSaving(section); setErrs({});
    try {
      await updateUserProfile(user.id, patch as never);
      if (section === "profile" && cvFile) { await uploadCv(cvFile); setCvFile(null); }
      await refreshProfile();
      toast("success", "Saved. The matching sheet updates within a minute.");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Could not save.";
      setErrs({ [section]: m, ...(/username/i.test(m) ? { username: m } : {}), ...(/linkedin/i.test(m) ? { linkedinUrl: m } : {}) });
    } finally { setSaving(""); }
  }
  const Save = ({ s, data }: { s: string; data: Record<string, unknown> }) => (
    <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
      {errs[s] && <p role="alert" className="mr-auto text-sm text-rose-700">{errs[s]}</p>}
      <button type="button" disabled={!!saving} onClick={() => save(s, data)} className={btnPrimary}>{saving === s && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Save</button>
    </div>
  );
  const toggleCat = (id: string) => setHub((h) => ({ ...h, competitionInterests: h.competitionInterests.includes(id) ? h.competitionInterests.filter((x) => x !== id) : h.competitionInterests.length >= 8 ? h.competitionInterests : [...h.competitionInterests, id] }));

  return (
    <div className="grid gap-8 lg:grid-cols-[11rem_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="lg:sticky lg:top-24 lg:self-start">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map(([id, l]) => <li key={id}><a href={`#${id}`} className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-2 hover:bg-white hover:text-ink">{l}</a></li>)}
        </ul>
      </nav>
      <div className="min-w-0 space-y-6">
        <Card id="profile" title="Profile" note="Used for matching and shown on your partner posts. It syncs to the GSIC matching sheet.">
          <label htmlFor="st-name" className="mb-1.5 block text-sm font-medium text-ink">Full name</label>
          <input id="st-name" value={name} onChange={(e) => setName(e.target.value)} className={input()} />
          <div className="mt-6"><ProfileFields value={values} onChange={setValues} errors={errs} cv={{ label: cvFile?.name ?? (userProfile.hasCv ? "a CV is on file" : null), error: "", onPick: (f) => setCvFile(f && f.type === "application/pdf" && f.size <= 5 * 1024 * 1024 ? f : null) }} /></div>
          {userProfile.hasCv && <button type="button" onClick={async () => { await removeCv().catch(() => undefined); await refreshProfile(); }} className="mt-3 text-sm font-medium text-rose-700 underline">Remove CV</button>}
          <label htmlFor="st-bio" className="mb-1.5 mt-6 block text-sm font-medium text-ink">Bio <span className="font-normal text-ink-3">(optional)</span></label>
          <textarea id="st-bio" rows={3} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} className={cn(input(), "h-auto py-2.5")} />
          <Save s="profile" data={{ name: name.trim(), bio: bio.trim(), ...values, preferredRole: values.preferredRole || null, pkmRole: values.pkmRole || null }} />
        </Card>

        <Card id="photo" title="Photo" note="A clear face photo gets more replies on partner posts.">
          <AvatarPicker name={userProfile.name} current={userProfile.avatarUrl}
            onUpload={async (b) => { await uploadAvatar(b); await refreshProfile(); toast("success", "Photo updated."); }}
            onPreset={async (url) => { await updateUserProfile(user.id, { avatarUrl: url } as never); await refreshProfile(); toast("success", "Photo updated."); }} />
        </Card>

        <Card id="hub" title="Hub profile" note="What other members see in the directory and on your posts.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="st-user" className="mb-1.5 block text-sm font-medium text-ink">Username</label>
              <div className="flex items-center rounded-lg border border-slate-300 bg-paper pl-3 text-sm text-ink-3 focus-within:ring-2 focus-within:ring-brand-600/20">/u/<input id="st-user" value={hub.username} onChange={(e) => setHub({ ...hub, username: e.target.value.toLowerCase() })} className="h-11 flex-1 rounded-r-lg bg-white px-2 text-ink focus:outline-none" /></div>
              {errs.username && <p className="mt-1 text-xs text-rose-600">{errs.username}</p>}
            </div>
            <div><label htmlFor="st-head" className="mb-1.5 block text-sm font-medium text-ink">Headline</label><input id="st-head" value={hub.headline} maxLength={120} onChange={(e) => setHub({ ...hub, headline: e.target.value })} placeholder="IE 2025 · BCC analyst · 2x finalist" className={input()} /></div>
            <div><label htmlFor="st-port" className="mb-1.5 block text-sm font-medium text-ink">Portfolio <span className="font-normal text-ink-3">(optional)</span></label><input id="st-port" type="url" value={hub.portfolioUrl} onChange={(e) => setHub({ ...hub, portfolioUrl: e.target.value })} placeholder="https://" className={input()} /></div>
            <div><label htmlFor="st-gh" className="mb-1.5 block text-sm font-medium text-ink">GitHub <span className="font-normal text-ink-3">(optional)</span></label><input id="st-gh" type="url" value={hub.githubUrl} onChange={(e) => setHub({ ...hub, githubUrl: e.target.value })} placeholder="https://github.com/you" className={input()} /></div>
          </div>
          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-ink">Competitions you want <span className="font-normal text-ink-3">(up to 8, used for your Monday digest and matching)</span></legend>
            <div className="mt-2 flex flex-wrap gap-2">{COMPETITION_CATEGORIES.map((c) => <button key={c.id} type="button" aria-pressed={hub.competitionInterests.includes(c.id)} onClick={() => toggleCat(c.id)} className={chip(hub.competitionInterests.includes(c.id))}>{c.label}</button>)}</div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-ink">Achievements <span className="font-normal text-ink-3">(up to 5)</span></legend>
            <ul className="mt-2 space-y-2">
              {ach.map((a, i) => (
                <li key={i} className="grid grid-cols-[1fr_5rem_8rem_auto] gap-2">
                  <input aria-label="Title" value={a.title} onChange={(e) => setAch(ach.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Shopee Code League" className={cn(input(), "h-10")} />
                  <input aria-label="Year" type="number" value={a.year ?? ""} onChange={(e) => setAch(ach.map((x, j) => (j === i ? { ...x, year: e.target.value ? +e.target.value : undefined } : x)))} placeholder="2026" className={cn(input(), "h-10")} />
                  <input aria-label="Result" value={a.result ?? ""} onChange={(e) => setAch(ach.map((x, j) => (j === i ? { ...x, result: e.target.value } : x)))} placeholder="Finalist" className={cn(input(), "h-10")} />
                  <button type="button" onClick={() => setAch(ach.filter((_, j) => j !== i))} aria-label="Remove" className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-3 hover:bg-slate-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
            {ach.length < 5 && <button type="button" onClick={() => setAch([...ach, { title: "" }])} className={cn(btnSecondary, "mt-2 h-10")}><Plus className="h-4 w-4" aria-hidden="true" />Add</button>}
          </fieldset>
          <div className="mt-4 divide-y divide-slate-100">
            <Toggle on={hub.openToTeam} onChange={(v) => setHub({ ...hub, openToTeam: v })} label="Open to joining a team" hint="Shows a badge on your profile and in the matching sheet." />
            <Toggle on={hub.directoryVisible} onChange={(v) => setHub({ ...hub, directoryVisible: v })} label="Show me in the member directory" hint="Only signed-in members can see the directory. Your WhatsApp is never shown there." />
          </div>
          <Save s="hub" data={{ ...hub, username: hub.username || undefined, portfolioUrl: hub.portfolioUrl || null, githubUrl: hub.githubUrl || null, achievements: ach.filter((a) => a.title.trim()) }} />
        </Card>

        <Card id="notifications" title="Email" note={`Sent from GSIC to ${userProfile.email}. Account emails such as password resets always arrive.`}>
          {!prefs ? <div className="h-40 animate-pulse rounded-lg bg-paper" /> : (
            <div className="divide-y divide-slate-100">
              {Object.entries(NOTIFY_KINDS).filter(([, v]) => !v.admin || isAdmin).map(([k, v]) => (
                <Toggle key={k} on={prefs[k] !== false} label={v.label} onChange={async (on) => {
                  setPrefs({ ...prefs, [k]: on });
                  const r = await callApi("/api/me/notify-prefs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [k]: on }) });
                  if (!r.ok) { setPrefs((p) => ({ ...p!, [k]: !on })); toast("error", r.error); }
                }} />
              ))}
            </div>
          )}
        </Card>

        <Card id="account" title="Account">
          <div className="flex flex-wrap gap-2">
            <Link href="/auth?mode=forgot" className={btnSecondary}>Change password</Link>
            <button type="button" onClick={() => supabase.auth.signOut()} className={btnSecondary}>Sign out</button>
          </div>
          <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/60 p-5">
            <h3 className="font-semibold text-rose-900">Delete account</h3>
            <p className="mt-1 text-sm leading-6 text-rose-900/80">Closes your partner posts, withdraws your responses, removes your photo and CV, and clears your row in the matching sheet. This cannot be undone.</p>
            <label htmlFor="st-del" className="mt-4 block text-sm text-rose-900">Type <span className="font-mono">{userProfile.email}</span> to confirm</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <input id="st-del" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={cn(input(), "max-w-sm")} autoComplete="off" />
              <button type="button" disabled={confirm.trim().toLowerCase() !== userProfile.email.toLowerCase() || saving === "delete"}
                onClick={async () => { setSaving("delete"); try { await deleteAccount(confirm.trim()); await supabase.auth.signOut(); window.location.href = "/?deleted=1"; } catch (e) { toast("error", e instanceof Error ? e.message : "Could not delete."); setSaving(""); } }}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50">
                {saving === "delete" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Delete my account
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
