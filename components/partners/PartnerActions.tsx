"use client";
// The interactive side of a partner post. Logged out: read-only with a sign-in nudge. Responder: pick a role,
// write a note, see status and (after accept) the owner's contact. Owner: responses, accept/decline, extend, filled, close.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { ContactReveal, PersonLine, callApi, type Person } from "@/components/teams/shared";
import { btnPrimary, btnSecondary, chip, input } from "@/components/hub/buttons";
import { roleText } from "@/lib/partner-labels";
import { applySchema } from "@/lib/validation/teams";
import { fieldErrors } from "@/lib/validation/auth";
import { cn } from "@/lib/cn";

interface App { id: string; role: string; message: string; status: string; applicant: Person }
interface Detail {
  id: string; kind: string; title: string; competition: string; status: string; slots: number; rolesNeeded: string[]; isOwner: boolean;
  owner: Person; myApplication: { id: string; role: string; message: string; status: string } | null; applications?: App[];
}
const STATUS: Record<string, string> = { pending: "Waiting for a reply", accepted: "Accepted", declined: "Not this time", withdrawn: "Withdrawn" };

export default function PartnerActions({ id, open }: { id: string; open: boolean }) {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [d, setD] = useState<Detail | null>(null);
  const [role, setRole] = useState("");
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const r = await callApi<{ call: Detail }>(`/api/teams/calls/${id}`);
    if (r.ok) setD(r.data.call);
  }, [id]);
  useEffect(() => { if (user) void load(); }, [user, load]);

  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-white" />;
  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="font-semibold text-ink">Interested?</p>
        <p className="mt-1 text-sm text-ink-3">Sign in to respond. Your note goes to the poster, and contacts open up for both of you after an accept.</p>
        <Link href={`/auth?mode=signin&next=/partners/${id}`} className={cn(btnPrimary, "mt-4 w-full")}>Sign in to respond</Link>
      </div>
    );
  }
  if (!d) return <div className="h-40 animate-pulse rounded-xl bg-white" />;

  const lft = d.kind === "looking_for_team";
  const me = userProfile?.name ?? "a GSIC member";

  async function act(body: object, label: string) {
    setBusy(label);
    const r = await callApi(`/api/teams/calls/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy("");
    if (r.ok) { toast("success", label === "extend" ? "Extended by 14 days." : "Updated."); void load(); } else toast("error", r.error);
  }
  async function decide(appId: string, status: "accepted" | "declined" | "withdrawn") {
    setBusy(appId);
    const r = await callApi(`/api/teams/applications/${appId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy("");
    if (!r.ok) toast("error", r.error);
    void load();
  }
  async function respond(e: React.FormEvent) {
    e.preventDefault();
    const parsed = applySchema.safeParse({ role, message: msg });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setBusy("respond");
    const r = await callApi(`/api/teams/calls/${id}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    setBusy("");
    if (r.ok) { toast("success", "Sent. You will get an email when they reply."); setErrors({}); void load(); } else setErrors({ ...(r.fieldErrors ?? {}), form: r.error });
  }
  async function report() {
    const reason = window.prompt("What is wrong with this post? (optional)");
    if (reason === null) return;
    const r = await callApi(`/api/teams/calls/${id}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reason || undefined }) });
    toast(r.ok ? "success" : "error", r.ok ? "Thanks. An admin will look at it." : r.error);
  }

  if (d.isOwner) {
    const apps = d.applications ?? [];
    return (
      <section id="responses" className="space-y-4" aria-label="Responses">
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!!busy} onClick={() => act({ action: "extend", days: 14 }, "extend")} className={btnSecondary}>Extend 14 days</button>
          {d.status === "open" && <button type="button" disabled={!!busy} onClick={() => act({ action: "filled" }, "filled")} className={btnSecondary}>Mark filled</button>}
          {d.status === "open" && <button type="button" disabled={!!busy} onClick={() => act({ action: "close" }, "close")} className={btnSecondary}>Close</button>}
        </div>
        <h2 className="font-display text-lg font-semibold text-ink">Responses <span className="tnum text-ink-3">{apps.length}</span></h2>
        {apps.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-ink-3">No responses yet. Share the post in your WhatsApp groups to reach more people.</p> : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {apps.map((a) => (
              <li key={a.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <PersonLine p={a.applicant} />
                  {a.status === "pending" ? (
                    <div className="flex gap-2">
                      <button type="button" disabled={busy === a.id || d.status !== "open"} onClick={() => decide(a.id, "accepted")} className="h-9 rounded-lg bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">Accept</button>
                      <button type="button" disabled={busy === a.id} onClick={() => decide(a.id, "declined")} className="h-9 rounded-lg border border-slate-300 px-3.5 text-sm font-medium text-ink-2 hover:bg-slate-50 disabled:opacity-60">Decline</button>
                    </div>
                  ) : <span className="label-mono text-ink-3">{STATUS[a.status]}</span>}
                </div>
                <p className="mt-2 text-sm text-ink-2"><span className="font-medium">{roleText(a.role)}.</span> {a.message}</p>
                {a.status === "accepted" && <ContactReveal person={a.applicant} me={me} competition={d.competition} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  const mine = d.myApplication;
  return (
    <div className="space-y-3">
      {mine && mine.status !== "withdrawn" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="label-mono text-ink-3">Your response</p>
          <p className="mt-1 font-semibold text-ink">{STATUS[mine.status]}</p>
          <p className="mt-1 text-sm text-ink-2">As {roleText(mine.role)}. {mine.message}</p>
          {mine.status === "accepted" && <ContactReveal person={d.owner} me={me} competition={d.competition} />}
          {mine.status === "pending" && <button type="button" onClick={() => decide(mine.id, "withdrawn")} className="mt-3 text-sm font-medium text-ink-3 underline">Withdraw</button>}
        </div>
      ) : open ? (
        <form onSubmit={respond} noValidate className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="font-semibold text-ink">{lft ? "Invite them to your team" : "Respond to this post"}</p>
          {errors.form && <p role="alert" className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{errors.form}</p>}
          <fieldset className="mt-3">
            <legend className="mb-1.5 text-sm text-ink-2">{lft ? "Which role would they take?" : "Which role would you take?"}</legend>
            <div className="flex flex-wrap gap-1.5">{d.rolesNeeded.map((r) => <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)} className={chip(role === r)}>{roleText(r)}</button>)}</div>
            {lft && <input aria-label="Other role" value={d.rolesNeeded.includes(role) ? "" : role} onChange={(e) => setRole(e.target.value)} placeholder="Or name another role" className={cn(input(), "mt-2 h-10")} />}
            {errors.role && <p className="mt-1 text-xs text-rose-600">{errors.role}</p>}
          </fieldset>
          <label htmlFor="pa-msg" className="mt-3 block text-sm text-ink-2">A short note <span className="text-ink-3">({msg.length}/400)</span></label>
          <textarea id="pa-msg" rows={4} maxLength={400} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={lft ? "What your team is building and why they fit" : "What you have done before that fits this role"} className={cn(input(!!errors.message), "mt-1 h-auto py-2.5")} />
          {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message}</p>}
          {!userProfile?.linkedinUrl && <p className="mt-2 text-xs text-navy">Add your LinkedIn on <Link href="/settings" className="underline">settings</Link> first.</p>}
          <button type="submit" disabled={busy === "respond"} className={cn(btnPrimary, "mt-4 w-full")}>{busy === "respond" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Send response</button>
        </form>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-ink-3">This post is no longer taking responses.</p>
      )}
      <button type="button" onClick={report} className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink"><Flag className="h-3.5 w-3.5" aria-hidden="true" /> Report this post</button>
    </div>
  );
}
