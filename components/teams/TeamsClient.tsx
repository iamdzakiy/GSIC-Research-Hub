"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/cn";
import { INTERESTS, PKM_SCHEMES, PREFERRED_ROLES, labelOf } from "@/lib/profile-options";
import { applySchema, createCallSchema } from "@/lib/validation/teams";
import { fieldErrors } from "@/lib/validation/auth";
import { ContactReveal, Empty, ErrorBox, Modal, PersonLine, Skeleton, fmtDate, inputCls, roleLabel, type Person } from "@/components/teams/shared";

const TABS = [["open", "Open calls"], ["mine", "My calls"], ["applied", "My applications"], ["match", "Suggested people"]] as const;
type Tab = (typeof TABS)[number][0];

interface CallRow {
  id: string; title: string; competition: string; interests: string[]; rolesNeeded: string[]; slots: number; description: string; deadline: string;
  owner: Person; myApplication: { id: string; status: string; role: string } | null; reason: string;
}
interface MyCall {
  id: string; title: string; competition: string; rolesNeeded: string[]; slots: number; status: string; deadline: string;
  applications: { id: string; role: string; message: string; status: string; applicant: Person }[];
}
interface MyApp { id: string; role: string; message: string; status: string; call: { id: string; title: string; competition: string; status: string; deadline: string }; owner: Person }
interface Match { name: string; preferredRole: string | null; interests: string[]; major: string; faculty: string; linkedinUrl: string | null; reason: string }

async function call<T>(url: string, init?: RequestInit & { headers?: Record<string, string> }): Promise<{ ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> }> {
  try {
    const res = await apiFetch(url, init);
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.ok === false) return { ok: false, error: body?.error ?? "Something went wrong.", fieldErrors: body?.fieldErrors };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection." };
  }
}

const STATUS_CLS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700", accepted: "bg-mint-100 text-mint-900", declined: "bg-rose-50 text-rose-800", withdrawn: "bg-slate-100 text-slate-500",
  open: "bg-mint-100 text-mint-900", filled: "bg-brand-50 text-brand-800", closed: "bg-slate-100 text-slate-500",
};
const Badge = ({ s }: { s: string }) => <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_CLS[s])}>{s}</span>;

export default function TeamsClient() {
  const { user, userProfile, loading } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const tab = (TABS.find(([id]) => id === params.get("tab"))?.[0] ?? "open") as Tab;
  const [posting, setPosting] = useState(false);

  const go = (t: Tab) => router.replace(`/teams?tab=${t}`, { scroll: false });

  if (loading) return <Skeleton />;
  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Sign in to find teammates</h1>
        <p className="mt-2 text-sm text-slate-600">Post a call for a competition, or apply to someone else's.</p>
        <Link href="/auth?mode=signin&next=/teams" className="mt-5 inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">Sign in</Link>
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Teams</p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-slate-900">Find your team</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">A good team mixes roles: a lead, an analyst, a content specialist and someone who runs the project.</p>
        </div>
        <button type="button" onClick={() => setPosting(true)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          <Plus className="h-4 w-4" aria-hidden="true" /> Post a call
        </button>
      </header>

      {!userProfile?.linkedinUrl && (
        <p role="status" className="mt-5 rounded-lg border border-cream-300 bg-cream-100 px-4 py-3 text-sm text-navy">
          Add your LinkedIn profile on your <Link href="/dashboard" className="font-medium underline">dashboard</Link> before posting or applying. Teammates check it first.
        </p>
      )}

      <div role="tablist" aria-label="Teams" className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => go(id)}
            className={cn("whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors", tab === id ? "border-brand-600 text-brand-700" : "border-transparent text-slate-600 hover:text-slate-900")}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === "open" && <OpenCalls />}
        {tab === "mine" && <MyCalls />}
        {tab === "applied" && <Applied />}
        {tab === "match" && <Matches />}
      </div>

      {posting && <PostCall onClose={() => setPosting(false)} onDone={() => { setPosting(false); go("mine"); }} />}
    </>
  );
}

// ---------------- Open calls ----------------
function OpenCalls() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<CallRow[] | null>(null);
  const [err, setErr] = useState("");
  const [competition, setCompetition] = useState("");
  const [scheme, setScheme] = useState("");
  const [role, setRole] = useState("");
  const [applyTo, setApplyTo] = useState<CallRow | null>(null);
  const opportunity = params.get("opportunity") ?? "";
  const event = params.get("event") ?? "";

  const load = useCallback(async () => {
    setErr("");
    const q = new URLSearchParams();
    if (competition) q.set("competition", competition);
    if (scheme) q.set("scheme", scheme);
    if (role) q.set("role", role);
    if (opportunity) q.set("opportunity", opportunity);
    if (event) q.set("event", event);
    const r = await call<{ calls: CallRow[] }>(`/api/teams/calls?${q}`);
    if (r.ok) setRows(r.data.calls); else { setRows([]); setErr(r.error); }
  }, [competition, scheme, role, opportunity, event]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="f-comp" className="mb-1 block text-xs font-medium text-slate-600">Competition</label>
          <input id="f-comp" value={competition} onChange={(e) => setCompetition(e.target.value)} placeholder="e.g. PKM-RE 2027" className={cn(inputCls(), "h-10")} />
        </div>
        <div>
          <label htmlFor="f-scheme" className="mb-1 block text-xs font-medium text-slate-600">PKM scheme</label>
          <select id="f-scheme" value={scheme} onChange={(e) => setScheme(e.target.value)} className={cn(inputCls(), "h-10")}>
            <option value="">Any scheme</option>
            {PKM_SCHEMES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-role" className="mb-1 block text-xs font-medium text-slate-600">Role needed</label>
          <select id="f-role" value={role} onChange={(e) => setRole(e.target.value)} className={cn(inputCls(), "h-10")}>
            <option value="">Any role</option>
            {PREFERRED_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
      </div>
      {(opportunity || event) && (
        <p className="mt-3 text-sm text-slate-600">Showing calls for one competition. <button type="button" onClick={() => router.replace("/teams?tab=open")} className="font-medium text-brand-700 underline">Show all</button></p>
      )}

      <div className="mt-5 space-y-3">
        {rows === null ? <Skeleton /> : err ? <ErrorBox message={err} onRetry={load} /> : rows.length === 0 ? (
          <Empty title="No open calls match" hint="Clear a filter, or post your own call." />
        ) : rows.map((c) => (
          <article key={c.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-heading text-base font-bold text-slate-900">{c.title}</h2>
                <p className="mt-0.5 text-sm text-slate-600">{c.competition} · closes {fmtDate(c.deadline)} · {c.slots} {c.slots === 1 ? "slot" : "slots"} left</p>
              </div>
              {c.myApplication ? <Badge s={c.myApplication.status} /> : (
                <button type="button" onClick={() => setApplyTo(c)} className="h-10 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Apply</button>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{c.description}</p>
            <p className="mt-3 flex flex-wrap gap-1.5">
              {c.rolesNeeded.map((r) => <span key={r} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">{roleLabel(r)}</span>)}
              {c.interests.map((i) => <span key={i} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600">{labelOf(INTERESTS, i)}</span>)}
            </p>
            {c.reason && <p className="mt-3 text-xs font-medium text-mint-800">{c.reason}</p>}
            <div className="mt-4 border-t border-slate-100 pt-3"><PersonLine p={c.owner} /></div>
          </article>
        ))}
      </div>

      {applyTo && <Apply row={applyTo} onClose={() => setApplyTo(null)} onDone={() => { setApplyTo(null); toast("success", "Application sent."); void load(); }} />}
    </div>
  );
}

function Apply({ row, onClose, onDone }: { row: CallRow; onClose: () => void; onDone: () => void }) {
  const { userProfile } = useAuth();
  const [role, setRole] = useState(row.rolesNeeded.includes(userProfile?.preferredRole ?? "") ? userProfile!.preferredRole! : row.rolesNeeded[0] ?? "");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = applySchema.safeParse({ role, message });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setBusy(true);
    const r = await call(`/api/teams/calls/${row.id}/apply`, { method: "POST", body: JSON.stringify(parsed.data) });
    setBusy(false);
    if (r.ok) return onDone();
    setErrors({ ...(r.fieldErrors ?? {}), form: r.error });
  }

  return (
    <Modal title={`Apply: ${row.title}`} onClose={onClose}>
      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        {errors.form && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errors.form}</p>}
        <div>
          <label htmlFor="ap-role" className="mb-1.5 block text-sm font-medium text-slate-700">Role you would take</label>
          <select id="ap-role" value={role} onChange={(e) => setRole(e.target.value)} className={cn(inputCls(errors.role), "h-11")}>
            {row.rolesNeeded.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
          {errors.role && <p className="mt-1 text-xs text-rose-600">{errors.role}</p>}
        </div>
        <div>
          <label htmlFor="ap-msg" className="mb-1.5 block text-sm font-medium text-slate-700">Why you fit <span className="font-normal text-slate-400">({message.length}/400)</span></label>
          <textarea id="ap-msg" rows={4} maxLength={400} value={message} onChange={(e) => setMessage(e.target.value)} aria-invalid={!!errors.message} className={cn(inputCls(errors.message), "py-2.5")} />
          {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message}</p>}
        </div>
        {!userProfile?.hasCv && <p className="text-sm text-slate-600">Teams read CVs. You can add one from your <Link href="/dashboard" className="font-medium text-brand-700 underline">profile</Link> any time. It is not required.</p>}
        <p className="text-xs text-slate-500">They see your name, role, major, LinkedIn and CV. Your WhatsApp stays hidden until they accept.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? "Sending…" : "Send application"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------- Post a call ----------------
function PostCall({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const params = useSearchParams();
  const [opps, setOpps] = useState<{ id: string; slug: string; title: string }[]>([]);
  const [f, setF] = useState({ title: "", competition: "", opportunityId: "", slots: "1", description: "", deadline: "" });
  const [roles, setRoles] = useState<string[]>([]);
  const [schemes, setSchemes] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (l: string[], v: string) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);

  useEffect(() => {
    fetch("/api/opportunities?type=competition&pageSize=100").then((r) => (r.ok ? r.json() : null)).then((b) => {
      const list = (b?.opportunities ?? []) as { id: string; slug: string; title: string }[];
      setOpps(list);
      const pre = list.find((o) => o.slug === params.get("opportunity"));
      if (pre) setF((p) => ({ ...p, opportunityId: pre.id, competition: pre.title }));
    }).catch(() => undefined);
  }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...f, opportunityId: f.opportunityId || null, rolesNeeded: roles, interests: schemes };
    const parsed = createCallSchema.safeParse(payload);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setBusy(true);
    const r = await call("/api/teams/calls", { method: "POST", body: JSON.stringify(payload) });
    setBusy(false);
    if (r.ok) { toast("success", "Your call is live."); return onDone(); }
    setErrors({ ...(r.fieldErrors ?? {}), form: r.error });
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-xs text-rose-600">{errors[k]}</p> : null);
  return (
    <Modal title="Post a call for teammates" onClose={onClose}>
      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        {errors.form && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errors.form}</p>}
        <div>
          <label htmlFor="pc-title" className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
          <input id="pc-title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Looking for an analyst for a food-tech PKM-RE" aria-invalid={!!errors.title} className={cn(inputCls(errors.title), "h-11")} />
          <Err k="title" />
        </div>
        <div>
          <label htmlFor="pc-opp" className="mb-1.5 block text-sm font-medium text-slate-700">Competition <span className="font-normal text-slate-400">(pick one or type below)</span></label>
          <select id="pc-opp" value={f.opportunityId} onChange={(e) => { const o = opps.find((x) => x.id === e.target.value); setF((p) => ({ ...p, opportunityId: e.target.value, competition: o?.title ?? p.competition })); }} className={cn(inputCls(), "mb-2 h-11")}>
            <option value="">Not listed on GSIC Hub</option>
            {opps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
          <input aria-label="Competition name" value={f.competition} onChange={(e) => set("competition", e.target.value)} placeholder="PKM-RE 2027" aria-invalid={!!errors.competition} className={cn(inputCls(errors.competition), "h-11")} />
          <Err k="competition" />
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">Roles you need</legend>
          <div className="flex flex-wrap gap-2">
            {PREFERRED_ROLES.map((r) => (
              <button key={r.id} type="button" aria-pressed={roles.includes(r.id)} onClick={() => setRoles(toggle(roles, r.id))}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", roles.includes(r.id) ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-brand-400")}>{r.label}</button>
            ))}
          </div>
          <Err k="rolesNeeded" />
        </fieldset>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">PKM scheme <span className="font-normal text-slate-400">(optional)</span></legend>
          <div className="flex flex-wrap gap-2">
            {PKM_SCHEMES.map((s) => (
              <button key={s.id} type="button" aria-pressed={schemes.includes(s.id)} onClick={() => setSchemes(toggle(schemes, s.id))}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", schemes.includes(s.id) ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-brand-400")}>{s.label}</button>
            ))}
          </div>
          <Err k="interests" />
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pc-slots" className="mb-1.5 block text-sm font-medium text-slate-700">Open slots</label>
            <input id="pc-slots" type="number" min={1} max={10} value={f.slots} onChange={(e) => set("slots", e.target.value)} aria-invalid={!!errors.slots} className={cn(inputCls(errors.slots), "h-11")} />
            <Err k="slots" />
          </div>
          <div>
            <label htmlFor="pc-deadline" className="mb-1.5 block text-sm font-medium text-slate-700">Apply by</label>
            <input id="pc-deadline" type="date" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} aria-invalid={!!errors.deadline} className={cn(inputCls(errors.deadline), "h-11")} />
            <Err k="deadline" />
          </div>
        </div>
        <div>
          <label htmlFor="pc-desc" className="mb-1.5 block text-sm font-medium text-slate-700">What you are building <span className="font-normal text-slate-400">({f.description.length}/600)</span></label>
          <textarea id="pc-desc" rows={4} maxLength={600} value={f.description} onChange={(e) => set("description", e.target.value)} aria-invalid={!!errors.description} className={cn(inputCls(errors.description), "py-2.5")} />
          <Err k="description" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? "Posting…" : "Post call"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------- My calls + applications ----------------
function useMine() {
  const [data, setData] = useState<{ calls: MyCall[]; applications: MyApp[] } | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    setErr("");
    const r = await call<{ calls: MyCall[]; applications: MyApp[] }>("/api/teams/applications");
    if (r.ok) setData(r.data); else { setData({ calls: [], applications: [] }); setErr(r.error); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { data, err, load };
}

function MyCalls() {
  const { data, err, load } = useMine();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState("");

  async function decide(id: string, status: "accepted" | "declined") {
    setBusy(id);
    const r = await call(`/api/teams/applications/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setBusy("");
    if (r.ok) toast("success", status === "accepted" ? "Accepted. Contact details are now visible." : "Declined."); else toast("error", r.error);
    void load();
  }
  async function close(id: string) {
    const r = await call(`/api/teams/calls/${id}`, { method: "PATCH", body: JSON.stringify({ status: "closed" }) });
    if (!r.ok) toast("error", r.error);
    void load();
  }

  if (!data) return <Skeleton />;
  if (err) return <ErrorBox message={err} onRetry={load} />;
  if (!data.calls.length) return <Empty title="You have no calls yet" hint="Post one and applicants will show up here." />;
  return (
    <div className="space-y-4">
      {data.calls.map((c) => (
        <article key={c.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">{c.title}</h2>
              <p className="mt-0.5 text-sm text-slate-600">{c.competition} · closes {fmtDate(c.deadline)} · {c.slots} {c.slots === 1 ? "slot" : "slots"} left</p>
            </div>
            <div className="flex items-center gap-3"><Badge s={c.status} />{c.status === "open" && <button type="button" onClick={() => close(c.id)} className="text-sm font-medium text-slate-600 underline hover:text-slate-900">Close call</button>}</div>
          </div>
          {c.applications.length === 0 ? <p className="mt-4 text-sm text-slate-500">No applicants yet.</p> : (
            <ul className="mt-4 divide-y divide-slate-100">
              {c.applications.map((a) => (
                <li key={a.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <PersonLine p={a.applicant} />
                    <div className="flex items-center gap-2"><Badge s={a.status} />
                      {a.status === "pending" && (<>
                        <button type="button" disabled={busy === a.id || c.status !== "open"} onClick={() => decide(a.id, "accepted")} className="h-9 rounded-lg bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">Accept</button>
                        <button type="button" disabled={busy === a.id} onClick={() => decide(a.id, "declined")} className="h-9 rounded-lg border border-slate-300 px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Decline</button>
                      </>)}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-700"><span className="font-medium">{roleLabel(a.role)}.</span> {a.message}</p>
                  {a.status === "accepted" && <ContactReveal person={a.applicant} me={userProfile?.name ?? "a GSIC member"} competition={c.competition} />}
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

function Applied() {
  const { data, err, load } = useMine();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  async function withdraw(id: string) {
    const r = await call(`/api/teams/applications/${id}`, { method: "PATCH", body: JSON.stringify({ status: "withdrawn" }) });
    if (!r.ok) toast("error", r.error);
    void load();
  }

  if (!data) return <Skeleton />;
  if (err) return <ErrorBox message={err} onRetry={load} />;
  if (!data.applications.length) return <Empty title="No applications yet" hint="Apply to an open call and track its status here." />;
  return (
    <div className="space-y-4">
      {data.applications.map((a) => (
        <article key={a.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">{a.call.title}</h2>
              <p className="mt-0.5 text-sm text-slate-600">{a.call.competition} · as {roleLabel(a.role)}</p>
            </div>
            <div className="flex items-center gap-3"><Badge s={a.status} />{a.status === "pending" && <button type="button" onClick={() => withdraw(a.id)} className="text-sm font-medium text-slate-600 underline hover:text-slate-900">Withdraw</button>}</div>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3"><PersonLine p={a.owner} /></div>
          {a.status === "accepted" && <ContactReveal person={a.owner} me={userProfile?.name ?? "a GSIC member"} competition={a.call.competition} />}
        </article>
      ))}
    </div>
  );
}

// ---------------- Suggested people ----------------
function Matches() {
  const [rows, setRows] = useState<Match[] | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    setErr("");
    const r = await call<{ matches: Match[] }>("/api/matchmaking");
    if (r.ok) setRows(r.data.matches); else { setRows([]); setErr(r.error); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (!rows) return <Skeleton />;
  if (err) return <ErrorBox message={err} onRetry={load} />;
  if (!rows.length) return <Empty title="No suggestions yet" hint="Pick a preferred role and your PKM interests on your profile to get matches." />;
  return (
    <ul className="space-y-3">
      {rows.map((m) => (
        <li key={`${m.name}-${m.linkedinUrl}`} className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="font-semibold text-slate-900">{m.name}</p>
          <p className="text-sm text-slate-600">{[roleLabel(m.preferredRole), m.major, m.faculty].filter(Boolean).join(" · ")}</p>
          {m.reason && <p className="mt-2 text-xs font-medium text-mint-800">{m.reason}</p>}
          {m.linkedinUrl && <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">View LinkedIn</a>}
        </li>
      ))}
      <li className="px-1 text-xs leading-5 text-slate-500">Introduce yourself clearly, have a specific purpose, and never mass-message. Contact details are never shared outside the platform without consent.</li>
    </ul>
  );
}
