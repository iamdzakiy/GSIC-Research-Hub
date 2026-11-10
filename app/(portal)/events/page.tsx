import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SERIES, eventHref, eventWhen, seriesOf } from "@/lib/event-links";
import PageHero from "@/components/hub/PageHero";
import Blank from "@/components/hub/Blank";

export const metadata: Metadata = {
  title: "GSIC Programs · GSIC Hub",
  description: "GSIC PKM Bootcamp and The Sandbox Series.",
};
export const dynamic = "force-dynamic";

const BLURB: Record<string, string> = {
  "GSIC PKM Bootcamp": "Pendampingan PKM dari keresahan sampai proposal yang siap submit.",
  "The Sandbox Series": "Design sprint lintas disiplin: satu pertanyaan besar per sesi.",
};

export default async function EventsIndexPage() {
  const events = await prisma.event.findMany({ where: { status: { not: "archived" } }, orderBy: [{ comingSoon: "asc" }, { startDate: "asc" }, { createdAt: "asc" }] }).catch(() => []);
  const groups = SERIES.map((name) => ({ name, items: events.filter((e) => seriesOf(e) === name) })).filter((g) => g.items.length);

  return (
    <main>
      <PageHero kicker="GSIC Programs" title={<>Programs run <span className="outline-cream">by GSIC</span></>}>
        Every program is being prepared. Open one and press &ldquo;Kabari saya&rdquo; to get an email when registration opens.
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {groups.length === 0 && <Blank title="No programs yet" hint="GSIC programs appear here as soon as they are announced." />}
        {groups.map((g) => (
          <section key={g.name} aria-labelledby={g.name}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
              <h2 id={g.name} className="font-display text-2xl font-bold tracking-tight text-ink">{g.name}</h2>
              <p className="text-sm text-ink-3">{BLURB[g.name]}</p>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {g.items.map((e) => (
                <li key={e.id}>
                  <Link href={eventHref(e)} className="lift group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
                    <span className={`label-mono w-fit rounded px-1.5 py-0.5 ${e.comingSoon ? "bg-cream-100 text-cream-700" : "bg-mint-50 text-mint-800"}`}>{e.comingSoon ? "Segera hadir" : eventWhen(e)}</span>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-ink">{e.title}</h3>
                    <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-6 text-ink-3">{e.shortDescription}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">{e.comingSoon ? "Kabari saya" : "Lihat program"} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
