"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock, Flag, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useNimGate } from "@/components/portal/NimGate";
import QuestionInput from "@/components/assess/QuestionInput";
import SaveStatus, { DrawCheck, type SaveState } from "@/components/motion/SaveStatus";
import { ProgressBar } from "@/components/motion/Progress";
import { btnPrimary, btnSecondary } from "@/components/hub/buttons";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/cn";
import type { PublicQuestion, PublicTest, StateOut, SubmittedPayload } from "@/lib/assessments";
import type { AnswerIn } from "@/lib/scoring";

type Value = string | string[];
type Payload = Omit<StateOut, "attempt" | "result"> & { ok?: boolean; error?: string; attempt?: StateOut["attempt"]; result?: SubmittedPayload };

const has = (v: Value | undefined) => (Array.isArray(v) ? v.length > 0 : (v ?? "").trim() !== "");
const KIND_LABEL: Record<string, string> = { pre_test: "Pre-test", post_test: "Post-test", survey: "Survey" };
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const localKey = (uid: string, tid: string) => `gsic_attempt_v1:${uid}:${tid}`;

function usedFor(t: PublicTest): string {
  if (t.kind === "survey") return t.surveyUnlocks || t.episode != null ? "Your answers go to the organisers as a summary. Finishing it opens the answer explanations and your report card for this episode." : "Your answers go to the organisers as a summary. It does not change any score.";
  if (t.kind === "pre_test") return "It measures where you start, so the post-test can show how far you moved. It is not graded and nobody is ranked. Your result appears after the post-test.";
  return "It is compared with your pre-test to show your progress on your report card.";
}

export default function AssessmentRunner({ idOrCode }: { idOrCode: string }) {
  const { user, userProfile, loading: authLoading, refreshProfile } = useAuth();
  const nimGate = useNimGate();
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/assessments/${encodeURIComponent(idOrCode)}`);
      const b = (await res.json().catch(() => null)) as Payload | null;
      if (!res.ok || !b) { setErr(b?.error ?? "Could not load this."); return; }
      setErr(""); setData(b);
    } catch { setErr("Could not reach the server. Check your connection."); }
  }, [idOrCode]);

  useEffect(() => { if (!authLoading && user) void load(); }, [authLoading, user, load]);

  async function start() {
    if (!(await nimGate.ensureNim())) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/assessments/${encodeURIComponent(idOrCode)}/start`, { method: "POST" });
      const b = (await res.json().catch(() => null)) as Payload | null;
      if (!res.ok || !b) { setErr(b?.error ?? "Could not start."); return; }
      setData(b);
    } finally { setBusy(false); }
  }

  const shell = (children: React.ReactNode) => <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">{nimGate.sheet}{children}</div>;
  const card = "rounded-2xl border border-slate-200 bg-white p-6 sm:p-8";

  if (authLoading) return shell(<div className={card}><div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" /><div className="mt-4 h-24 animate-pulse rounded bg-slate-100" /></div>);
  if (!user) return shell(
    <div className={cn(card, "text-center")}>
      <p className="font-display text-lg font-semibold text-ink">Sign in to continue</p>
      <p className="mt-1 text-sm text-ink-3">Your answers are saved to your account.</p>
      <Link href={`/auth?mode=signin&next=${encodeURIComponent(typeof window === "undefined" ? "/" : window.location.pathname)}`} className={cn(btnPrimary, "mt-5")}>Sign in</Link>
    </div>);
  if (err && !data) return shell(<div className={card} role="alert"><p className="font-semibold text-ink">{err}</p><button type="button" onClick={() => void load()} className={cn(btnSecondary, "mt-4")}>Try again</button></div>);
  if (!data) return shell(<div className={card}><div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" /><div className="mt-4 h-24 animate-pulse rounded bg-slate-100" /></div>);

  const t = data.test;
  const head = (
    <header className="mb-6">
      {t.eventSlug && <Link href={`/events/${t.eventSlug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-brand-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t.eventTitle ?? "Event"}</Link>}
      <p className="label-mono mt-3 text-brand-700">{KIND_LABEL[t.kind] ?? "Test"}{t.episode ? ` · Episode ${t.episode}` : ""}</p>
      <h1 lang="id" className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t.title}</h1>
    </header>
  );

  const blocked: Partial<Record<StateOut["state"], { title: string; body: string; action?: React.ReactNode }>> = {
    not_open: { title: "Not open yet", body: "The organisers have not opened this. Check back when the session starts." },
    closed: { title: "This has closed", body: "It is no longer taking answers." },
    needs_registration: { title: "Register for the event first", body: "This is for registered participants.", action: t.eventSlug ? <Link href={`/events/${t.eventSlug}`} className={btnPrimary}>Go to the event page</Link> : null },
    needs_pre: { title: "One step first", body: "Finish the earlier step before this one.", action: data.next ? <Link href={data.next.href} className={btnPrimary}>{data.next.label}</Link> : null },
    needs_nim: { title: "Add your NIM", body: "We need it to link your results to you.", action: <button type="button" className={btnPrimary} onClick={async () => { if (await nimGate.ensureNim()) { await refreshProfile(); await load(); } }}>Add my NIM</button> },
  };
  const b = blocked[data.state];
  if (b) return shell(<>{head}<div className={card} role="status"><p className="font-display text-lg font-semibold text-ink">{b.title}</p><p className="mt-1 text-sm text-ink-3">{b.body}</p>{b.action && <div className="mt-5">{b.action}</div>}</div></>);

  if (data.state === "ready") {
    return shell(<>{head}
      <div className={card}>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div><dt className="label-mono text-ink-3">{t.kind === "survey" ? "Items" : "Questions"}</dt><dd className="mt-1 font-display text-2xl font-bold text-ink">{t.questionCount}</dd></div>
          <div><dt className="label-mono text-ink-3">Time limit</dt><dd className="mt-1 font-display text-2xl font-bold text-ink">{t.durationMinutes ? `${t.durationMinutes} min` : "None"}</dd></div>
          <div><dt className="label-mono text-ink-3">One attempt</dt><dd className="mt-1 text-sm text-ink-2">{t.durationMinutes ? "The clock runs on our server. Closing the tab does not pause it." : "Your answers save as you go."}</dd></div>
        </dl>
        {t.description && <p lang="id" className="mt-6 text-[15px] leading-7 text-ink-2">{t.description}</p>}
        <p className="mt-4 text-sm leading-6 text-ink-3">{usedFor(t)}</p>
        {err && <p role="alert" className="mt-4 text-sm text-rose-700">{err}</p>}
        <button type="button" onClick={start} disabled={busy} className={cn(btnPrimary, "mt-6 w-full sm:w-auto")}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Start</button>
      </div></>);
  }

  if (data.state === "submitted" && data.result) return shell(<>{head}<Result test={t} r={data.result} /></>);
  if (data.state === "in_progress" && data.attempt) {
    return shell(<>{head}<Runner key={t.id} test={t} attempt={data.attempt} userId={user.id} idOrCode={idOrCode} onState={(p) => setData(p)} /></>);
  }
  return shell(<div className={card}>Something went wrong.</div>);
}

// ---------------------------------------------------------------- the runner

function Runner({ test, attempt, userId, idOrCode, onState }: { test: PublicTest; attempt: NonNullable<StateOut["attempt"]>; userId: string; idOrCode: string; onState: (p: Payload) => void }) {
  const qs = attempt.questions;
  const [answers, setAnswers] = useState<Record<string, Value>>(() => {
    const base = Object.fromEntries(attempt.answers.map((a) => [a.questionId, a.answer]));
    try {
      const raw = window.localStorage.getItem(localKey(userId, test.id));
      const l = raw ? (JSON.parse(raw) as { dirty?: boolean; answers?: Record<string, Value> }) : null;
      if (l?.dirty && l.answers) return { ...base, ...l.answers };
    } catch { /* ignore */ }
    return base;
  });
  const [flagged, setFlagged] = useState<string[]>(attempt.flagged);
  const [idx, setIdx] = useState(0);
  const [review, setReview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [left, setLeft] = useState<number | null>(attempt.secondsLeft);
  const [note, setNote] = useState("");
  const endsAt = useRef<number | null>(attempt.secondsLeft == null ? null : Date.now() + attempt.secondsLeft * 1000);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ answers, flagged });
  latest.current = { answers, flagged };
  const submitted = useRef(false);
  const survey = test.kind === "survey";

  const list = (a: Record<string, Value>): AnswerIn[] => Object.entries(a).filter(([, v]) => has(v)).map(([questionId, answer]) => ({ questionId, answer }));

  const push = useCallback(async () => {
    const { answers: a, flagged: f } = latest.current;
    if (navigator.onLine === false) { setStatus("offline"); return; }
    setStatus("saving");
    try {
      const res = await apiFetch(`/api/assessments/${encodeURIComponent(idOrCode)}/attempt`, { method: "PUT", body: JSON.stringify({ answers: list(a), flagged: f }) });
      if (res.ok) { setStatus("saved"); try { window.localStorage.setItem(localKey(userId, test.id), JSON.stringify({ dirty: false, answers: a })); } catch { /* ignore */ } }
      else setStatus(res.status === 409 ? "error" : "offline");
    } catch { setStatus("offline"); }
  }, [idOrCode, test.id, userId]);

  const queueSave = useCallback(() => {
    try { window.localStorage.setItem(localKey(userId, test.id), JSON.stringify({ dirty: true, answers: latest.current.answers })); } catch { /* ignore */ }
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void push(), 600);
  }, [push, userId, test.id]);

  useEffect(() => { const on = () => void push(); window.addEventListener("online", on); return () => { window.removeEventListener("online", on); if (timer.current) clearTimeout(timer.current); }; }, [push]);
  // If a copy from this device was newer than the server's, send it up now.
  useEffect(() => { try { if (JSON.parse(window.localStorage.getItem(localKey(userId, test.id)) ?? "{}").dirty) void push(); } catch { /* ignore */ } }, [push, userId, test.id]);

  const setAnswer = (id: string, v: Value) => { setAnswers((p) => ({ ...p, [id]: v })); setErrors((e) => { if (!e[id]) return e; const { [id]: _, ...rest } = e; void _; return rest; }); setTimeout(queueSave, 0); };
  const toggleFlag = (id: string) => { setFlagged((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])); setTimeout(queueSave, 0); };

  const submit = useCallback(async (byClock = false) => {
    if (submitted.current) return;
    submitted.current = true; setSubmitting(true); setFormErr("");
    try {
      const res = await apiFetch(`/api/assessments/${encodeURIComponent(idOrCode)}/submit`, { method: "POST", body: JSON.stringify({ answers: list(latest.current.answers) }) });
      const b = (await res.json().catch(() => null)) as (Payload & { fieldErrors?: Record<string, string> }) | null;
      if (res.ok && b) { try { window.localStorage.removeItem(localKey(userId, test.id)); } catch { /* ignore */ } onState(b); return; }
      submitted.current = false;
      if (res.status === 422 && b?.fieldErrors) {
        setErrors(b.fieldErrors);
        const first = qs.findIndex((q) => b.fieldErrors![q.id]);
        if (first >= 0) { setReview(false); setIdx(first); }
        setFormErr("Some answers need a look.");
      } else if (res.status === 409) {
        const r2 = await apiFetch(`/api/assessments/${encodeURIComponent(idOrCode)}`); const s = (await r2.json().catch(() => null)) as Payload | null;
        if (s?.state === "submitted") { onState(s); return; }
        setFormErr(b?.error ?? "Could not submit.");
      } else setFormErr(b?.error ?? (byClock ? "Time is up. Your saved answers will be counted." : "Could not submit. Your answers are saved, try again."));
    } catch { submitted.current = false; setFormErr("Could not reach the server. Your answers are saved here, try again."); }
    finally { setSubmitting(false); }
  }, [idOrCode, onState, qs, test.id, userId]);

  // The clock. The server is the authority, this is only the display and the nudge to send.
  useEffect(() => {
    if (endsAt.current == null) return;
    const tick = () => {
      const s = Math.max(0, Math.round((endsAt.current! - Date.now()) / 1000));
      setLeft(s);
      if (s === 300) setNote("5 minutes left.");
      if (s === 60) setNote("1 minute left.");
      if (s === 0) void submit(true);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [submit]);

  const q = qs[idx];
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey || review) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(qs.length - 1, i + 1)); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
      else if (/^[1-9]$/.test(e.key) && q && q.options && (q.type === "multiple_choice" || q.type === "single_choice")) {
        const o = q.options[Number(e.key) - 1]; if (o) setAnswer(q.id, o);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, review, qs.length]);

  const answered = qs.filter((x) => has(answers[x.id])).length;
  const unanswered = qs.filter((x) => !has(answers[x.id]));
  const sectionOf = useMemo(() => { const m = new Map<string, string>(); test.sections?.forEach((s) => s.ids.forEach((id) => m.set(id, s.title))); return m; }, [test.sections]);

  const timerEl = left != null && (
    <p className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-semibold tabular-nums", left <= 60 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-ink-2")} role="timer" aria-label={`Time left ${mmss(left)}`}>
      <Clock className="h-4 w-4" aria-hidden="true" />{mmss(left)}
    </p>
  );

  const side = (
    <nav aria-label="Questions" className="hidden lg:block">
      <ol className="grid grid-cols-5 gap-2">
        {qs.map((x, i) => (
          <li key={x.id}>
            <button type="button" onClick={() => { setReview(false); setIdx(i); }} aria-label={`Question ${i + 1}${has(answers[x.id]) ? ", answered" : ""}${flagged.includes(x.id) ? ", flagged" : ""}`} aria-current={!review && i === idx ? "step" : undefined}
              className={cn("relative h-10 w-full rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600", !review && i === idx ? "border-brand-600 bg-brand-600 text-white" : has(answers[x.id]) ? "border-brand-200 bg-brand-50 text-brand-800" : "border-slate-300 bg-white text-ink-2 hover:border-slate-400")}>
              {i + 1}{flagged.includes(x.id) && <Flag className="absolute -right-1 -top-1 h-3.5 w-3.5 fill-warning text-warning-800" aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setReview(true)} className={cn(btnSecondary, "mt-4 w-full")}>Review and submit</button>
    </nav>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-stretch">
          {timerEl}
          <div className="flex-1 lg:flex-none"><ProgressBar value={answered} max={qs.length} label={`${answered} of ${qs.length} answered`} /><p className="mt-1 text-xs text-ink-3">{answered} of {qs.length} answered</p></div>
        </div>
        {side}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
        <p role="status" aria-live="polite" className="sr-only">{note}</p>
        {note && <p className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-sm text-ink-2">{note}</p>}
        {formErr && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{formErr}</p>}

        {!review && q ? (
          <div key={q.id} className="step-in">
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-ink-3">
              <span className="label-mono">{sectionOf.get(q.id) ? <span lang="id">{sectionOf.get(q.id)} · </span> : null}{idx + 1} / {qs.length}</span>
              <button type="button" onClick={() => toggleFlag(q.id)} aria-pressed={flagged.includes(q.id)} className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium", flagged.includes(q.id) ? "bg-warning-50 text-warning-800" : "hover:bg-slate-100")}><Flag className="h-3.5 w-3.5" aria-hidden="true" />{flagged.includes(q.id) ? "Flagged" : "Flag for later"}</button>
            </div>
            <QuestionInput q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} error={errors[q.id]} />
          </div>
        ) : (
          <ReviewList qs={qs} answers={answers} flagged={flagged} errors={errors} onJump={(i) => { setReview(false); setIdx(i); }} unanswered={unanswered.length} survey={survey} />
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <SaveStatus state={status} />
          <div className="flex items-center gap-2">
            {(review || idx > 0) && <button type="button" onClick={() => (review ? setReview(false) : setIdx(idx - 1))} className={btnSecondary} aria-label="Previous"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>}
            {!review && idx < qs.length - 1 && <button type="button" onClick={() => setIdx(idx + 1)} className={btnPrimary}>Next<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
            {!review && idx === qs.length - 1 && <button type="button" onClick={() => setReview(true)} className={btnPrimary}>Review</button>}
            {review && <button type="button" disabled={submitting} onClick={() => void submit(false)} className={btnPrimary}>{submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Submit</button>}
          </div>
        </div>
        <button type="button" onClick={() => setReview(true)} className="mt-3 text-sm font-medium text-brand-700 hover:underline lg:hidden">Question list and submit</button>
      </div>
    </div>
  );
}

function ReviewList({ qs, answers, flagged, errors, onJump, unanswered, survey }: { qs: PublicQuestion[]; answers: Record<string, Value>; flagged: string[]; errors: Record<string, string>; onJump: (i: number) => void; unanswered: number; survey: boolean }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-ink">Review before you submit</h2>
      <p className="mt-1 text-sm text-ink-3">{unanswered === 0 ? "Everything is answered." : `${unanswered} ${survey ? "item" : "question"}${unanswered === 1 ? " is" : "s are"} not answered yet. You can still submit, an empty ${survey ? "item" : "question"} counts as skipped.`}</p>
      <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {qs.map((q, i) => (
          <li key={q.id}>
            <button type="button" onClick={() => onJump(i)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600">
              <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold", has(answers[q.id]) ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600")}>{has(answers[q.id]) ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}</span>
              <span className="min-w-0 flex-1"><span lang="id" className="line-clamp-2 text-sm text-ink-2">{q.text}</span>{errors[q.id] && <span className="mt-0.5 block text-xs text-rose-600">{errors[q.id]}</span>}</span>
              <span className="shrink-0 text-xs text-ink-3">{flagged.includes(q.id) ? "Flagged" : has(answers[q.id]) ? "" : "Not answered"}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- results

function Result({ test, r }: { test: PublicTest; r: SubmittedPayload }) {
  const card = "rounded-2xl border border-slate-200 bg-white p-6 sm:p-8";
  if (r.kind === "survey") return (
    <div className={cn(card, "text-center")} role="status"><DrawCheck className="mx-auto" /><h2 className="mt-4 font-display text-xl font-bold text-ink">Thank you</h2><p className="mt-1 text-sm text-ink-3">Your answers are in.{test.episode != null ? " The explanations and your report card for this episode are now open." : ""}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">{test.episode != null && <Link href="/rapor" className={btnPrimary}>Open my report card</Link>}{r.nextHref && <Link href={r.nextHref} className={test.episode != null ? btnSecondary : btnPrimary}>Back to the event</Link>}</div></div>
  );
  if (r.kind === "pre_test") return (
    <div className={cn(card, "text-center")} role="status"><DrawCheck className="mx-auto" /><h2 className="mt-4 font-display text-xl font-bold text-ink">Recorded</h2><p className="mt-1 text-sm text-ink-3">Your result appears after the post-test.</p>
      {r.nextHref && <Link href={r.nextHref} className={cn(btnPrimary, "mt-5")}>Back to the event</Link>}</div>
  );
  const s = r.score!;
  return (
    <div className="space-y-4">
      <div className={card} role="status">
        <p className="label-mono text-ink-3">Your post-test result</p>
        <p className="mt-2 font-display text-5xl font-extrabold text-ink">{s.percent}<span className="text-2xl text-ink-3">/100</span></p>
        <p className="mt-1 text-sm text-ink-3">{s.correct} of {s.total} correct{s.passed != null ? (s.passed ? `. You passed (${s.passingScore} needed).` : `. ${s.passingScore} was needed to pass.`) : ""}</p>
        {r.comparison && (
          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-center">
            <div><dt className="text-xs text-ink-3">Pre-test</dt><dd className="font-display text-xl font-bold text-ink">{r.comparison.prePercent}</dd></div>
            <div><dt className="text-xs text-ink-3">Post-test</dt><dd className="font-display text-xl font-bold text-ink">{r.comparison.postPercent}</dd></div>
            <div><dt className="text-xs text-ink-3">Change</dt><dd className="font-display text-xl font-bold text-ink">{r.comparison.delta > 0 ? "+" : ""}{r.comparison.delta}</dd></div>
          </dl>
        )}
      </div>
      {r.reviewLocked === "survey" && (
        <div className={card}><p className="font-semibold text-ink">Fill in the episode survey to open the explanations</p><p className="mt-1 text-sm text-ink-3">It takes about 3 minutes and opens the explanation for each question and this episode on your report card.</p>
          {r.surveyHref && <Link href={r.surveyHref} className={cn(btnPrimary, "mt-4")}>Open the survey</Link>}</div>
      )}
      {r.review && (
        <div className={card}>
          <h2 className="font-display text-lg font-bold text-ink">Question by question</h2>
          <ol className="mt-4 space-y-5">
            {r.review.map((x, i) => (
              <li key={x.questionId} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                <p lang="id" className="font-medium text-ink"><span className="text-ink-3">{i + 1}. </span>{x.text}</p>
                <p lang="id" className={cn("mt-2 text-sm", x.correct ? "text-mint-800" : "text-rose-700")}><span className="font-semibold">{x.correct ? "Correct" : x.answer ? "Not quite" : "Not answered"}.</span> {x.answer ? `Your answer: ${x.answer}.` : ""}</p>
                {!x.correct && x.correctAnswer && <p lang="id" className="mt-1 text-sm text-ink-2">Correct answer: {x.correctAnswer}</p>}
                {x.explanation && <p lang="id" className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-ink-2">{x.explanation}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="flex flex-wrap gap-3">{r.nextHref && <Link href={r.nextHref} className={btnSecondary}>Back to the event</Link>}<Link href="/rapor" className={btnSecondary}>Report card</Link></div>
    </div>
  );
}
