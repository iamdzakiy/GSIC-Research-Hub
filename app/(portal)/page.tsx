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
import CampusLinks from "@/components/hub/CampusLinks";
import Blank from "@/components/hub/Blank";
import { btnPrimary, btnSecondary } from "@/components/hub/buttons";

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

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-paper">
        <div className="bp-grid bp-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 pb-0 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <p className="rise label-mono text-brand-700">GSIC Research Hub · ITB</p>
          <h1 className="rise mt-4 max-w-4xl font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Find the competition. <span className="text-brand-600">Find the team.</span>
          </h1>
          <p className="rise mt-5 max-w-xl text-base leading-7 text-ink-2 sm:text-lg">BCC, BPC, case competitions, hackathons and PKM, sorted by when registration closes. Then find the analyst, designer or engineer your team is missing.</p>
          <div className="rise mt-8 flex flex-wrap items-center gap-3">
            <Link href="/competitions" className={btnPrimary}>Browse competitions <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href="/partners" className="inline-flex h-11 items-center px-2 text-sm font-semibold text-ink-2 underline decoration-mint-400 decoration-2 underline-offset-4 hover:text-ink">or look for a partner</Link>
          </div>
          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-3">
            {[[openComps, "competitions open"], [openPosts, "partner posts"], [members, "members"]].map(([n, l]) => (
              <div key={l as string}><dt className="sr-only">{l}</dt><dd><span className="tnum font-display text-3xl font-bold text-ink">{n}</span> <span className="text-sm text-ink-3">{l}</span></dd></div>
            ))}
          </dl>
          <nav aria-label="Categories" className="mt-8 flex flex-wrap gap-2">
            {COMPETITION_CATEGORIES.filter((c) => c.id !== "other").slice(0, 9).map((c) => (
              <Link key={c.id} href={`/competitions?cat=${c.id}`} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[13px] font-medium text-ink-2 transition-colors hover:border-brand-600 hover:text-brand-700">{c.label}</Link>
            ))}
          </nav>
          <CampusSilhouette draw className="mt-12 text-brand-600/60" strokeWidth={1.4} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Head kicker="Closing soon" title="Register before these close" href="/competitions" cta="All competitions" />
        {closing.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{closing.map((c) => <li key={c.id}><CompetitionCard c={c} /></li>)}</ul>
        ) : (
          <Blank title="No open competitions right now" hint="New ones are added every week. Know one that is missing?"><Link href="/competitions/submit" className={btnSecondary}>Submit a competition</Link></Blank>
        )}
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Head kicker="Seeking Partner" title="People looking for teammates" href="/partners" />
          {posts.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <li key={p.id}><PartnerCard p={p} /></li>)}</ul>
          ) : (
            <Blank title="No partner posts yet" hint="Need a financial modeler or a UI designer? Say which competition and which role."><Link href="/partners/new" className={btnSecondary}>Post what you need</Link></Blank>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Head kicker="GSIC programs" title="Coming up from GSIC" href="/events" cta="All programs" />
        <div className="grid gap-4 md:grid-cols-2">
          {SERIES.map((s) => {
            const list = events.filter((e) => seriesOf(e) === s);
            return (
              <article key={s} className="lift relative overflow-hidden rounded-2xl bg-navy p-6 text-white">
                <div className="bp-grid-dark absolute inset-0" aria-hidden="true" />
                <div className="relative">
                  <span className="label-mono rounded bg-cream px-1.5 py-0.5 text-navy">{list.every((e) => e.comingSoon) ? "Coming soon" : "Open"}</span>
                  <h3 className="mt-4 font-display text-2xl font-bold">{s}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">{s === SERIES[0] ? "Weeks of mentoring from idea to a funded PKM proposal, with reviewers who have been there." : "Hands-on sessions to build, test and pitch ideas with people from other majors."}</p>
                  <ul className="mt-5 space-y-2">
                    {list.map((e) => (
                      <li key={e.id}>
                        <Link href={eventHref(e)} className="group flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3.5 py-2.5 hover:border-mint/50">
                          <span className="min-w-0"><span className="block truncate text-sm font-semibold">{e.title}</span><span className="block text-xs text-slate-400">{eventWhen(e)}</span></span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-mint" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <CampusSilhouette className="relative -mb-6 mt-6 text-white/10" strokeWidth={1} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8"><CampusLinks /></section>
    </>
  );
}
