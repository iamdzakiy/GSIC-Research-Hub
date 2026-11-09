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
import { callApi as call, ContactReveal, Empty, ErrorBox, Modal, PersonLine, Skeleton, fmtDate, inputCls, roleLabel, type Person } from "@/components/teams/shared";

const TABS = [["mine", "My posts"], ["applied", "My responses"], ["match", "Suggested people"]] as const;
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


const STATUS_CLS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700", accepted: "bg-mint-100 text-mint-900", declined: "bg-rose-50 text-rose-800", withdrawn: "bg-slate-100 text-slate-500",
  open: "bg-mint-100 text-mint-900", filled: "bg-brand-50 text-brand-800", closed: "bg-slate-100 text-slate-500",
};
const Badge = ({ s }: { s: string }) => <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_CLS[s])}>{s}</span>;

export default function TeamsClient() {
  const { user, userProfile, loading } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const tab = (TABS.find(([id]) => id === params.get("tab"))?.[0] ?? "mine") as Tab;

  const go = (t: Tab) => router.replace(`/partners/manage?tab=${t}`, { scroll: false });

  if (loading) return <Skeleton />;
  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Sign in to manage your posts</h1>
        <p className="mt-2 text-sm text-slate-600">Post a call for a competition, or apply to someone else's.</p>
        <Link href="/auth?mode=signin&next=/partners/manage" className="mt-5 inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">Sign in</Link>
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono text-brand-700">Seeking Partner</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Your posts and responses</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-3">Accept or decline responses, extend a post, or mark it filled. Contacts open up after an accept. <Link href="/partners" className="font-medium text-brand-700 underline">Browse all posts</Link></p>
        </div>
        <Link href="/partners/new" className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"><Plus className="h-4 w-4" aria-hidden="true" /> Post what you need</Link>
      </header>

      {!userProfile?.linkedinUrl && (
        <p role="status" className="mt-5 rounded-lg border border-cream-300 bg-cream-100 px-4 py-3 text-sm text-navy">
          Add your LinkedIn profile on your <Link href="/settings" className="font-medium underline">settings</Link> before posting or responding. Teammates check it first.
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
                {tab === "mine" && <MyCalls />}
        {tab === "applied" && <Applied />}
        {tab === "match" && <Matches />}
      </div>

    </>
  );
}

// ---------------- My posts ----------------
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
                        <button type="button" disabled={busy === a.id || c.status !== "open"} onClick={() => decide(a.id, "accepted")} className="h-9 rounded-lg border border-brand-600 px-3.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60">Accept</button>
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
