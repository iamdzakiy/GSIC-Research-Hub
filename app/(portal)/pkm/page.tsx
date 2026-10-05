import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { COACHING, FORMAT_CHECKS, ROOT_CAUSES, SCHEMES, STATS, STATS_SOURCE, TIMELINE, TIMELINE_NOTE } from "@/lib/pkm-content";
import PathStepper from "@/components/portal/PathStepper";
import BootcampEpisodes from "@/components/portal/BootcampEpisodes";
import CountUp from "@/components/portal/CountUp";
import Reveal from "@/components/portal/Reveal";

export const metadata: Metadata = {
  title: "PKM guide · GSIC Hub",
  description: "PKM schemes, the four-episode GSIC bootcamp, proposal coaching and a reference timeline for ITB students.",
};

const H2 = ({ id, children, sub }: { id: string; children: React.ReactNode; sub?: string }) => (
  <div className="mb-6"><h2 id={id} className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{children}</h2>{sub && <p className="mt-1 max-w-2xl text-sm text-slate-600">{sub}</p>}</div>
);

export default function PkmPage() {
  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-wider text-mint">PKM guide</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Write a PKM proposal that gets funded</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">PKM is the national student creativity program. This page explains the schemes, how the GSIC bootcamp is built, and what proposal coaching looks like. Items marked planned are proposals for 2026/27 and are not confirmed yet.</p>
          </Reveal>
          <dl className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="border-l-2 border-mint pl-4">
                <dd className="font-display text-3xl font-extrabold text-cream">
                  {"to" in s ? <><CountUp value={s.value} />{"suffix" in s ? s.suffix : ""} <span className="text-slate-500">to</span> <CountUp value={s.to} />{"suffix" in s ? s.suffix : ""}</> : <CountUp value={s.value} />}
                </dd>
                <dt className="mt-1 text-xs text-slate-300">{s.label}</dt>
                <dt className="text-xs text-slate-500">{s.note}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs text-slate-500">{STATS_SOURCE}</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-16 px-4 py-14 sm:px-6 lg:px-8">
        <section aria-labelledby="path">
          <H2 id="path" sub="Select a stage.">The path</H2>
          <PathStepper />
        </section>

        <section aria-labelledby="schemes">
          <H2 id="schemes" sub="GSIC concentrates on four schemes. The others are listed so you know they exist.">PKM schemes</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SCHEMES.map((s) => (
              <Reveal key={s.code}>
                <article className={`h-full rounded-xl border p-5 ${s.focus ? "border-brand-200 bg-white" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">{s.code}</span>
                    {s.focus && <span className="rounded-md bg-mint-100 px-2 py-0.5 text-xs font-semibold text-mint-800">GSIC focus</span>}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{s.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{s.text}</p>
                  {"n2026" in s && <p className="mt-3 text-xs text-slate-500">{s.n2026} · {s.funded}</p>}
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section aria-labelledby="bootcamp">
          <H2 id="bootcamp" sub="12.5 hours in total, about 75% workshop. Every session has a pre-test and a post-test.">The bootcamp, episode by episode</H2>
          <BootcampEpisodes />
          <p className="mt-4 text-sm text-slate-600">Assignments are the competition files: the abstract comes from Episodes 1 and 2, the proposal from Episode 3 and the pitch from Episode 4.</p>
        </section>

        <section aria-labelledby="why">
          <H2 id="why" sub="Why ITB proposals fall out, and what the program does about it.">Problems and fixes</H2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {ROOT_CAUSES.map((r, i) => (
              <div key={r.problem} className={`grid gap-1 px-5 py-4 md:grid-cols-[1fr_2fr] md:gap-6 ${i ? "border-t border-slate-100" : ""}`}>
                <p className="text-sm font-semibold text-slate-900">{r.problem}</p>
                <p className="text-sm leading-6 text-slate-600">{r.fix}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="coaching">
          <H2 id="coaching" sub="Planned for 2026/27. Mentors are alumni of PKM-funded teams, faculty, and outside mentors when needed.">Proposal coaching</H2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {COACHING.map(([t, d], i) => (
              <li key={t} className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{t}</h3>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="checker">
          <H2 id="checker" sub="In development. Fixed rules catch format errors. A language model reads for meaning. A person always decides.">Format checker</H2>
          <div className="grid gap-4 md:grid-cols-2">
            {([["Rules, exact", FORMAT_CHECKS.rules], ["Meaning, flagged for review", FORMAT_CHECKS.meaning]] as const).map(([t, list]) => (
              <div key={t} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">{t}</h3>
                <ul className="mt-3 space-y-2">{list.map((x) => <li key={x} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" aria-hidden="true" />{x}</li>)}</ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Findings come in three levels: critical (can disqualify), warning (check it) and suggestion (optional).</p>
        </section>

        <section aria-labelledby="timeline">
          <H2 id="timeline">Reference timeline, October to May</H2>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIMELINE.map((t) => (
              <li key={t.m} className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="rounded-md bg-cream-100 px-2 py-0.5 text-xs font-bold text-slate-800">{t.m}</span>
                <p className="mt-2 text-sm text-slate-700">{t.t}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-slate-500">{TIMELINE_NOTE}</p>
        </section>

        <section className="rounded-2xl bg-brand-600 p-8 text-white">
          <h2 className="font-display text-xl font-bold">Ready to start?</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">Create an account, pick PKM-RE or another scheme as an interest, and register for the next bootcamp session.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/events/pkm-bootcamp" className="inline-flex h-11 items-center gap-1 rounded-lg bg-mint px-5 text-sm font-semibold text-navy hover:bg-mint-300">PKM Bootcamp <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href="/blog" className="inline-flex h-11 items-center rounded-lg border border-white/30 px-5 text-sm font-semibold hover:bg-white/10">Read the blog guides</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
