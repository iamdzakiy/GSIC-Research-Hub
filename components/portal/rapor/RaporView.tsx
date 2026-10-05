"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Award, ChevronDown, Download, Printer, Minus, Check, X } from "lucide-react";
import { apiFetch, extractError } from "@/lib/apiFetch";
import { raporToCsv, type RaporEvent, type RaporSummary } from "@/lib/scoring";
import { formatDateId } from "@/lib/opportunity-status";
import { cn } from "@/lib/cn";
import ScoreRing from "./ScoreRing";
import CountUp from "@/components/portal/CountUp";
import Reveal from "@/components/portal/Reveal";
import Confetti from "@/components/portal/Confetti";

interface Payload { profile: { name: string | null; email: string; faculty: string | null; major: string | null; year: number | null } | null; events: RaporEvent[]; summary: RaporSummary }

const STAGE: Record<RaporEvent["stage"], { label: string; cls: string }> = {
  registered: { label: "Menunggu pre-test", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  pre_done: { label: "Menunggu post-test", cls: "bg-cream-100 text-slate-800 border-cream-300" },
  completed: { label: "Selesai", cls: "bg-mint-100 text-mint-800 border-mint-300" },
};

function Gain({ gain }: { gain: number | null }) {
  if (gain === null) return <span className="text-sm text-slate-400">Selisih tersedia setelah post-test</span>;
  const Icon = gain > 0 ? ArrowUpRight : gain < 0 ? ArrowDownRight : Minus;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-bold", gain > 0 ? "border-mint-300 bg-mint-100 text-mint-800" : gain < 0 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-100 text-slate-700")}>
      <Icon className="h-4 w-4" aria-hidden="true" /> {gain > 0 ? "+" : ""}{gain} poin
    </span>
  );
}

function Review({ ev }: { ev: RaporEvent }) {
  const [open, setOpen] = useState(false);
  const rows = ev.post?.detail ?? [];
  if (!rows.length) return null;
  return (
    <div className="mt-5 border-t border-slate-200 pt-4 print:hidden">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
        Pembahasan jawaban post-test <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <ol className="mt-3 space-y-3">
          {rows.map((q, i) => (
            <li key={q.questionId} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <p className="font-medium text-slate-900"><span className="text-slate-400">{i + 1}.</span> {q.text}</p>
              <p className="mt-1.5 flex items-start gap-1.5 text-slate-700">
                {q.correct === true ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-700" aria-hidden="true" /> : q.correct === false ? <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" /> : <Minus className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
                <span>Jawaban Anda: <span className="font-medium">{q.answer || "—"}</span></span>
              </p>
              {q.correct === false && q.correctAnswer && <p className="mt-1 pl-5.5 text-slate-600">Jawaban benar: <span className="font-medium text-mint-800">{q.correctAnswer}</span></p>}
              {q.type === "essay" && <p className="mt-1 text-xs text-slate-500">Esai: poin penuh bila dijawab; ditinjau manual oleh mentor.</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function RaporView({ embedded = false }: { embedded?: boolean }) {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  const celebrate = useMemo(() => !!data && data.summary.completed > 0 && (data.summary.avgGain ?? 0) > 0, [data]);
  const download = () => {
    if (!data) return;
    const url = URL.createObjectURL(new Blob(["﻿" + raporToCsv(data.events)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "rapor-gsic.csv"; a.click(); URL.revokeObjectURL(url);
  };

  if (err) return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Rapor gagal dimuat: {err}</div>;
  if (!data) return <div className="space-y-4" role="status" aria-busy="true"><span className="sr-only">Memuat rapor…</span>{[0, 1].map((i) => <div key={i} className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div>;

  const { summary: s, events, profile } = data;
  return (
    <div>
      {celebrate && <Confetti active />}
      {!embedded && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">Rapor {profile?.name ?? "Peserta"}</h2>
            <p className="text-sm text-slate-500 print:text-slate-700">{[profile?.major, profile?.faculty].filter(Boolean).join(" · ") || profile?.email}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"><Download className="h-4 w-4" aria-hidden="true" /> CSV</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><Printer className="h-4 w-4" aria-hidden="true" /> Cetak / PDF</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "Kegiatan diikuti", v: s.events, suf: "" },
          { l: "Rapor lengkap", v: s.completed, suf: "" },
          { l: "Rata-rata pre-test", v: s.avgPre, suf: "%" },
          { l: "Rata-rata kenaikan", v: s.avgGain, suf: " poin" },
        ].map((x) => (
          <div key={x.l} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-display text-2xl font-extrabold text-brand-700">{x.v === null ? "—" : <CountUp value={x.v} suffix={x.suf} />}</p>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">{x.l}</p>
          </div>
        ))}
      </div>
      {s.best && s.best.gain > 0 && <p className="mt-3 rounded-lg bg-mint-50 px-4 py-2.5 text-sm text-mint-800"><Award className="mr-1.5 inline h-4 w-4" aria-hidden="true" />Peningkatan terbaik: <strong>{s.best.title}</strong> (+{s.best.gain} poin)</p>}

      {events.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-slate-900">Belum ada rapor</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Daftar ke kegiatan GSIC, kerjakan pre-test dan post-test, lalu rapor Anda muncul di sini.</p>
          <Link href="/events/pkm-bootcamp" className="mt-5 inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Lihat kegiatan <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {events.map((ev, i) => (
            <Reveal key={ev.eventId} delay={Math.min(i, 4) * 0.05}>
              <article className="break-inside-avoid rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{ev.title}</h3>
                    <p className="text-xs text-slate-500">{formatDateId(ev.startDate)} · {ev.location}</p>
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", STAGE[ev.stage].cls)}>{STAGE[ev.stage].label}</span>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-6 sm:justify-start sm:gap-10">
                  <ScoreRing percent={ev.pre?.percent ?? null} label="Pre-test" tone="brand" />
                  <ArrowRight className="hidden h-5 w-5 text-slate-300 sm:block" aria-hidden="true" />
                  <ScoreRing percent={ev.post?.percent ?? null} label="Post-test" tone="mint" />
                  <div className="space-y-2">
                    <Gain gain={ev.gain} />
                    {ev.post && <p className="text-xs text-slate-500">Post-test: {ev.post.passed ? "memenuhi" : "belum memenuhi"} nilai lulus ({ev.post.passingScore}%)</p>}
                  </div>
                </div>
                <Review ev={ev} />
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
