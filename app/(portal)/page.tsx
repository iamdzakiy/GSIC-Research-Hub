import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { closingThisWeek } from "@/lib/competition-data";
import { latestPartnerPosts } from "@/lib/partners";
import { SERIES, eventHref, eventWhen, seriesOf } from "@/lib/event-links";
import { COMPETITION_CATEGORIES } from "@/lib/competitions";
import CompetitionCard from "@/components/hub/CompetitionCard";
import PartnerCard from "@/components/hub/PartnerCard";
import CampusSilhouette from "@/components/hub/CampusSilhouette";
import { HeroMark, HeroWords } from "@/components/hub/HeroIntro";
import CampusLinks from "@/components/hub/CampusLinks";
import DeadlineTicker from "@/components/hub/DeadlineTicker";
import DayPlate from "@/components/hub/DayPlate";
import { categoryLabel } from "@/lib/competitions";
import Blank from "@/components/hub/Blank";
import CountUp from "@/components/portal/CountUp";
import Reveal from "@/components/portal/Reveal";
import { btnPrimary, btnSecondary } from "@/components/hub/buttons";
import SeriesBand from "@/components/blog/SeriesBand";
import { BOOTCAMP_SERIES, bootcampRunning, getSeriesParts } from "@/lib/blog-series";

export const dynamic = "force-dynamic";

function Head({ kicker, title, href, cta }: { kicker: string; title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="label-mono text-brand-700">{kicker}</p>
        <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
      </div>
      {href && <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">{cta ?? "See all"} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </div>
  );
}

export default async function HomePage() {
  const now = new Date();
  const [closing, posts, events, stats] = await Promise.all([
    closingThisWeek(6, now).catch(() => []),
    latestPartnerPosts(6).catch(() => []),
    prisma.event.findMany({ where: { status: { not: "archived" } }, orderBy: [{ comingSoon: "desc" }, { startDate: "asc" }], take: 6 }).catch(() => []),
    Promise.all([
      prisma.opportunity.count({ where: { type: "competition", isPublished: true, deadline: { gt: now } } }),
      prisma.teamCall.count({ where: { status: "open", hiddenAt: null, deadline: { gt: now } } }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]).catch(() => [0, 0, 0]),
  ]);
  const [openComps, openPosts, members] = stats;
  // The Bootcamp article series is shown only while the Bootcamp is running.
  const seriesParts = (await bootcampRunning(now).catch(() => false)) ? await getSeriesParts(BOOTCAMP_SERIES).catch(() => []) : [];

  const ticker = closing.map((c) => ({ slug: c.slug, title: c.title, days: Math.ceil((c.deadline.getTime() - now.getTime()) / 86_400_000), cat: c.category ? categoryLabel(c.category) : undefined }));
  const cats = COMPETITION_CATEGORIES.filter((c) => c.id !== "other").slice(0, 12);

  return (
    <>
      {/* HERO: navy, blueprint, one huge statement */}
      <section className="hero relative overflow-hidden bg-navy text-white">
        <div className="bp-grid-dark absolute inset-0" aria-hidden="true" />
        <CampusSilhouette draw className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-[1500px] text-brand-400/50 [--draw-delay:1.5s]" strokeWidth={1.2} />
        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-14 sm:px-6 sm:pb-36 lg:px-8 lg:pt-20">
          <div className="flex items-center gap-4">
            <HeroMark size={64} />
            <p className="label-mono hero-late text-mint">GSIC Research Hub<br />Institut Teknologi Bandung</p>
          </div>
          <h1 className="mt-7 max-w-5xl font-display text-[2.9rem] font-bold leading-[0.95] tracking-[-0.03em] sm:text-7xl lg:text-[6.5rem]">
            <HeroWords text="Find the" /><HeroWords text="competition." startIndex={2} className="text-mint" /><br /><HeroWords text="Find the" startIndex={3} /><HeroWords text="team." startIndex={5} className="outline-cream" />
          </h1>
          <div className="logo-line hero-line mt-8 w-40" aria-hidden="true" />
          <p className="hero-late mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Every BCC, BPC, case competition, hackathon and PKM that ITB students can enter, sorted by the hour registration closes. Then meet the analyst, designer or engineer your team is missing.</p>
          <div className="hero-late mt-9 flex flex-wrap items-center gap-3">
            <Link href="/competitions" className="press inline-flex h-12 items-center gap-2 rounded-lg bg-mint px-6 text-sm font-semibold text-navy hover:bg-mint-300">Browse competitions <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href="/partners" className="press inline-flex h-12 items-center gap-2 rounded-lg border border-white/25 px-6 text-sm font-semibold text-white hover:border-mint hover:text-mint">Find a partner</Link>
          </div>
        </div>
      </section>
      <DeadlineTicker items={ticker} />

      {/* NUMBERS */}
      <section className="border-b border-slate-200 bg-white">
        <dl className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-slate-200 px-0 sm:px-6 lg:px-8">
          {[[openComps, "competitions open"], [openPosts, "partner posts"], [members, "members"]].map(([n, l]) => (
            <div key={l as string} className="px-4 py-6 sm:px-8 sm:py-9">
              <dd className="font-display text-4xl font-bold tracking-tight text-ink sm:text-6xl"><CountUp value={n as number} /></dd>
              <dt className="label-mono mt-2 text-ink-3">{l}</dt>
            </div>
          ))}
        </dl>
      </section>

      {seriesParts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
          <SeriesBand series={BOOTCAMP_SERIES} parts={seriesParts} heading="PKM Bootcamp reading list" />
        </section>
      )}

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Head kicker="Browse by type" title="What are you looking to enter?" />
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-300 bg-slate-300 sm:grid-cols-3 lg:grid-cols-4">
          {cats.map((c, i) => (
            <li key={c.id} className="bg-white">
              <Link href={`/competitions?cat=${c.id}`} className="tile flex h-full min-h-[7.5rem] flex-col justify-between border border-transparent p-5">
                <span className="tile-n tnum label-mono text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                <span><span className="block font-display text-2xl font-bold tracking-tight">{c.short}</span><span className="mt-0.5 block text-sm opacity-70">{c.label}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* CLOSING: ledger rows, not cards */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Head kicker="Closing soon" title="Register before these close" href="/competitions" cta="All competitions" />
          {closing.length ? (
            <ol className="divide-y divide-slate-300 border-y border-slate-300">
              {closing.map((c, i) => (
                <li key={c.id}>
                  <Link href={`/competitions/${c.slug}`} className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 py-5 transition-colors hover:bg-white sm:grid-cols-[3rem_1fr_9rem_auto] sm:px-3">
                    <span className="tnum label-mono text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg font-semibold tracking-tight text-ink group-hover:text-brand-700 sm:text-xl">{c.title}</span>
                      <span className="block truncate text-sm text-ink-3">{c.organizer}{c.theme ? ` · ${c.theme}` : ""}</span>
                    </span>
                    <span className="label-mono hidden text-ink-2 sm:block">{c.category ? categoryLabel(c.category) : "Competition"}</span>
                    <DayPlate deadline={c.deadline} />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <Blank title="No open competitions right now" hint="New ones are added every week. Know one that is missing?"><Link href="/competitions/submit" className={btnSecondary}>Submit a competition</Link></Blank>
          )}
        </div>
      </section>

      {/* PARTNERS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Head kicker="Seeking Partner" title="People looking for teammates" href="/partners" />
        {posts.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{posts.map((p, i) => <li key={p.id}><Reveal index={i}><PartnerCard p={p} /></Reveal></li>)}</ul>
        ) : (
          <Blank title="No partner posts yet" hint="Need a financial modeler or a UI designer? Say which competition and which role."><Link href="/partners/new" className={btnSecondary}>Post what you need</Link></Blank>
        )}
      </section>

      {/* PROGRAMS: dark panels */}
      <section className="-mb-20 bg-navy pb-20 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div><p className="label-mono text-mint">GSIC programs</p><h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-4xl">Coming up from GSIC</h2></div>
            <Link href="/events" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-mint hover:text-mint-300">All programs <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {SERIES.map((s, n) => {
              const list = events.filter((e) => seriesOf(e) === s);
              return (
                <article key={s} className="corner relative border border-white/15 p-6 text-white">
                  <div className="flex items-center justify-between"><span className="label-mono text-slate-400">Program {String(n + 1).padStart(2, "0")}</span><span className="label-mono rounded bg-cream px-1.5 py-0.5 text-navy">{list.every((e) => e.comingSoon) ? "Coming soon" : "Open"}</span></div>
                  <h3 className="mt-6 font-display text-3xl font-bold tracking-tight">{s}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">{s === SERIES[0] ? "Weeks of mentoring from idea to a funded PKM proposal, with reviewers who have been there." : "Hands-on sessions to build, test and pitch ideas with people from other majors."}</p>
                  <ul className="mt-6 space-y-2">
                    {list.map((e) => (
                      <li key={e.id}>
                        <Link href={eventHref(e)} className="group flex items-center justify-between gap-3 border border-white/10 px-3.5 py-3 hover:border-mint/60">
                          <span className="min-w-0"><span className="block truncate text-sm font-semibold">{e.title}</span><span className="block text-xs text-slate-400">{eventWhen(e)}</span></span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-mint" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
          <div className="mt-8"><CampusLinks /></div>
        </div>
      </section>
    </>
  );
}
