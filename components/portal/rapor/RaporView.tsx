"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, ChevronDown, Download, Lock, Printer, Check, X, Minus } from "lucide-react";
import { apiFetch, extractError } from "@/lib/apiFetch";
import { type RaporSummary } from "@/lib/scoring";
import type { RaporEpisode, RaporEventV3 } from "@/lib/rapor";
import { formatDate } from "@/lib/opportunity-status";
import { cn } from "@/lib/cn";
import ScoreRing from "./ScoreRing";
import CountUp from "@/components/portal/CountUp";
import Reveal from "@/components/portal/Reveal";
import PairBars from "@/components/charts/PairBars";

interface Payload { profile: { name: string | null; email: string; nim: string | null; faculty: string | null; major: string | null; year: number | null } | null; events: RaporEventV3[]; summary: RaporSummary }

const STATUS: Record<RaporEpisode["status"], { label: string; cls: string }> = {
  pre_pending: { label: "Pre-test pending", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  post_pending: { label: "Post-test pending", cls: "bg-cream-100 text-slate-800 border-cream-300" },
  survey_pending: { label: "Survey pending", cls: "bg-cream-100 text-slate-800 border-cream-300" },
  completed: { label: "Completed", cls: "bg-mint-100 text-mint-800 border-mint-300" },
};
const BAND = { low: "Low gain", medium: "Medium gain", high: "High gain" } as const;

function GainChip({ ep }: { ep: RaporEpisode }) {
  if (ep.fullAlready) return <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">Already at full score</span>;
  if (ep.nGain === null || !ep.band) return <span className="text-sm text-slate-400">Gain shows after the post-test</span>;
  const tone = ep.band === "high" ? "border-mint-300 bg-mint-100 text-mint-800" : ep.band === "medium" ? "border-brand-200 bg-brand-50 text-brand-800" : "border-slate-200 bg-slate-100 text-slate-700";
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={cn("rounded-full border px-3 py-1 text-sm font-bold", tone)}>{BAND[ep.band]}</span>
      <span className="text-xs text-slate-500">{ep.delta! > 0 ? "+" : ""}{ep.delta} points · normalised gain {ep.nGain.toFixed(2)}</span>
    </span>
  );
}

function Review({ ep }: { ep: RaporEpisode }) {
  const [open, setOpen] = useState(false);
  if (!ep.review?.length) return null;
  return (
    <div className="mt-4 border-t border-slate-200 pt-3 print:hidden">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
        Question review <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <ol className="mt-3 space-y-3">
          {ep.review.map((q, i) => (
            <li key={q.questionId} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <p lang="id" className="font-medium text-slate-900"><span className="text-slate-400">{i + 1}.</span> {q.text}</p>
              <p lang="id" className="mt-1.5 flex items-start gap-1.5 text-slate-700">
                {q.correct === true ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-700" aria-hidden="true" /> : q.correct === false ? <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" /> : <Minus className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
                <span>Your answer: <span className="font-medium">{q.answer || "Not answered"}</span></span>
              </p>
              {q.correct === false && q.correctAnswer && <p lang="id" className="mt-1 text-slate-600">Correct answer: <span className="font-medium text-mint-800">{q.correctAnswer}</span></p>}
              {q.explanation && <p lang="id" className="mt-2 rounded-lg bg-slate-50 px-3 py-2 leading-6 text-slate-700">{q.explanation}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Episode({ ep, bootcamp, surveyHref }: { ep: RaporEpisode; bootcamp: boolean; surveyHref: string | null }) {
  const st = STATUS[ep.status];
  return (
    <div className="rounded-lg border border-slate-200 p-4 break-inside-avoid">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 lang="id" className="text-sm font-semibold text-slate-900">{bootcamp && ep.episode ? `Episode ${ep.episode}` : ep.title}</h4>
        <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", st.cls)}>{st.label}</span>
      </div>
      {ep.locked ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-slate-600"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />Fill in the episode survey to open your scores and the explanations.{surveyHref && <> <Link href={surveyHref} className="font-semibold text-brand-700 hover:underline">Open the survey</Link></>}</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <ScoreRing percent={ep.prePercent} label="Pre-test" tone="brand" />
            <ArrowRight className="hidden h-5 w-5 text-slate-300 sm:block" aria-hidden="true" />
            <ScoreRing percent={ep.postPercent} label="Post-test" tone="mint" />
            <div className="space-y-2">
              <GainChip ep={ep} />
              {ep.passed !== null && <p className="text-xs text-slate-500">Post-test: {ep.passed ? "meets" : "does not meet"} the passing score ({ep.passingScore}%)</p>}
            </div>
          </div>
          <Review ep={ep} />
        </>
      )}
    </div>
  );
}

/** The certificate needs the sign-in token, so it is fetched and shown from a blob. */
async function openCertificate(eventId: string): Promise<string | null> {
  const r = await apiFetch(`/api/certificates/${eventId}`);
  if (!r.ok) return (await r.json().catch(() => null))?.error ?? "Could not make the certificate.";
  window.open(URL.createObjectURL(await r.blob()), "_blank", "noopener");
  return null;
}

export default function RaporView({ embedded = false }: { embedded?: boolean }) {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [certErr, setCertErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const r = await apiFetch("/api/rapor");
        if (!r.ok) throw new Error(await extractError(r));
        const j = (await r.json()) as Payload;
        if (live) setData(j);
      } catch (e) { if (live) setErr((e as Error).message); }
    })();
    return () => { live = false; };
  }, []);

  const download = () => {
    if (!data) return;
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Event", "Episode", "Pre-test (%)", "Post-test (%)", "Change", "Normalised gain", "Status"]];
    for (const e of data.events) for (const p of e.episodes) rows.push([e.title, p.episode ?? "", p.prePercent ?? "", p.postPercent ?? "", p.delta ?? "", p.nGain === null ? "" : p.nGain.toFixed(2), p.status] as never);
    const url = URL.createObjectURL(new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "report-card-gsic.csv"; a.click(); URL.revokeObjectURL(url);
  };

  if (err) return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Could not load your report card: {err}</div>;
  if (!data) return <div className="space-y-4" role="status" aria-busy="true"><span className="sr-only">Loading report card…</span>{[0, 1].map((i) => <div key={i} className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div>;

  const { summary: s, events, profile } = data;
  return (
    <div>
      {!embedded && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">Report card for {profile?.name ?? "Participant"}</h2>
            <dl className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 print:text-slate-700">
              {profile?.nim && <div className="flex gap-1.5"><dt>NIM</dt><dd className="font-medium text-slate-700">{profile.nim}</dd></div>}
              {(profile?.major || profile?.faculty) && <div className="flex gap-1.5"><dt>Program</dt><dd className="font-medium text-slate-700">{[profile?.major, profile?.faculty].filter(Boolean).join(" · ")}</dd></div>}
              {profile?.year && <div className="flex gap-1.5"><dt>Intake</dt><dd className="font-medium text-slate-700">{profile.year}</dd></div>}
            </dl>
          </div>
          <div className="flex gap-2 print:hidden">
            <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"><Download className="h-4 w-4" aria-hidden="true" /> CSV</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><Printer className="h-4 w-4" aria-hidden="true" /> Download PDF</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "Events joined", v: s.events, suf: "" },
          { l: "Completed", v: s.completed, suf: "" },
          { l: "Average pre-test", v: s.avgPre, suf: "%" },
          { l: "Average gain", v: s.avgGain, suf: " points" },
        ].map((x) => (
          <div key={x.l} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-display text-2xl font-extrabold text-brand-700">{x.v === null ? "—" : <CountUp value={x.v} suffix={x.suf} />}</p>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">{x.l}</p>
          </div>
        ))}
      </div>
      {certErr && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">{certErr}</p>}
      {s.best && s.best.gain > 0 && <p className="mt-3 rounded-lg bg-mint-50 px-4 py-2.5 text-sm text-mint-800"><Award className="mr-1.5 inline h-4 w-4" aria-hidden="true" />Best improvement: <strong>{s.best.title}</strong> (+{s.best.gain} points)</p>}

      {events.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-slate-900">No report cards yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Register for a GSIC event and take the pre-test and post-test. Your report card will appear here.</p>
          <Link href="/events/pkm-bootcamp-2027" className="mt-5 inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">View events <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {events.map((ev, i) => (
            <Reveal key={ev.eventId} delay={Math.min(i, 4) * 0.05}>
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{ev.title}</h3>
                    <p className="text-xs text-slate-500">{[ev.startDate ? formatDate(ev.startDate) : "", ev.location].filter(Boolean).join(" · ")}</p>
                  </div>
                  {ev.certificateEnabled && ev.stage === "completed" && <button type="button" onClick={async () => setCertErr(await openCertificate(ev.eventId))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 print:hidden"><Award className="h-4 w-4" aria-hidden="true" />Certificate</button>}
                </div>

                {ev.isBootcamp && ev.episodes.length > 1 && (
                  <div className="mt-5"><PairBars caption="Pre and post-test by episode" data={ev.episodes.map((e) => ({ label: `Ep ${e.episode}`, a: e.prePercent, b: e.postPercent }))} unit="%" /></div>
                )}
                {ev.confidence && (
                  <div className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Your confidence, 1 to 5</p>
                    <p className="mt-0.5">Before: <strong>{ev.confidence.pre ?? "–"}</strong> · After: <strong>{ev.confidence.post ?? "–"}</strong></p>
                  </div>
                )}

                <div className={cn("mt-5 grid gap-3", ev.episodes.length > 1 && "md:grid-cols-2")}>
                  {ev.episodes.map((ep) => <Episode key={ep.pairKey} ep={ep} bootcamp={ev.isBootcamp} surveyHref={ep.surveyId && ev.slug ? `/events/${ev.slug}/tests/${ep.surveyId}` : null} />)}
                </div>

                {ev.todo.length > 0 && (
                  <div className="mt-5 print:hidden">
                    <p className="text-sm font-semibold text-slate-900">Still to do</p>
                    <ul className="mt-1.5 space-y-1 text-sm">{ev.todo.map((t) => <li key={t.testId}>{ev.slug ? <Link href={`/events/${ev.slug}/tests/${t.testId}`} className="text-brand-700 hover:underline">{t.label}</Link> : t.label}</li>)}</ul>
                  </div>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
