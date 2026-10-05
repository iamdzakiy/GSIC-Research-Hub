import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PillarTabs from "@/components/portal/PillarTabs";
import Reveal from "@/components/portal/Reveal";

export const metadata: Metadata = {
  title: "About GSIC Research · GSIC Hub",
  description: "What GSIC Research does at ITB: Connection, the PKM Bootcamp and the Sandbox.",
};

const FLOW = [
  ["Take the pre-test", "Each bootcamp session starts with a short test so you and the mentors see where you are."],
  ["Attend the session", "Workshop-heavy, with a speaker, feedback on your assignment and Q&A."],
  ["Take the post-test", "Same topics again. The difference shows on your report card."],
  ["Become a GSIC member", "Finishing a session counts toward membership."],
  ["Get matched", "Meet other participants who want a team, then get invited to the next event."],
] as const;

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">About</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">GSIC Research</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          The Ganesha Students Innovation Center (GSIC) is a student-run center at Institut Teknologi Bandung. GSIC Research is its research and innovation arm. We keep a checked directory of opportunities, teach students how to write competitive research and PKM proposals, and give people from different majors a place to test ideas together.
        </p>
      </Reveal>

      <section className="mt-12" aria-labelledby="pillars">
        <h2 id="pillars" className="font-display text-xl font-bold text-slate-900">Three programs</h2>
        <div className="mt-5"><PillarTabs /></div>
      </section>

      <section className="mt-14" aria-labelledby="flow">
        <h2 id="flow" className="font-display text-xl font-bold text-slate-900">How a bootcamp session works</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {FLOW.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.05}>
              <li className="h-full rounded-xl border border-slate-200 bg-white p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{t}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">{d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mt-14 rounded-2xl bg-navy p-8 text-white">
        <h2 className="font-display text-xl font-bold">Start with the PKM guide</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">The guide covers the schemes, the four bootcamp episodes, proposal coaching and a reference timeline.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/pkm" className="inline-flex h-11 items-center gap-1 rounded-lg bg-mint px-5 text-sm font-semibold text-navy hover:bg-mint-300">Open the PKM guide <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href="/auth?mode=signup" className="inline-flex h-11 items-center rounded-lg border border-white/20 px-5 text-sm font-semibold text-white hover:border-mint hover:text-mint">Create an account</Link>
        </div>
      </section>
    </main>
  );
}
