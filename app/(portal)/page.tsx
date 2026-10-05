import Link from "next/link";
import { ArrowRight, Award, BookOpen, Briefcase, CalendarDays, FlaskConical, MapPin, Search, Trophy, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getClosingSoon, getLatest, getTypeCounts } from "@/lib/opportunities";
import { TYPE_CONFIG, OPP_TYPE_ORDER, type OppType } from "@/lib/opportunity-config";
import { daysLeft, formatDate } from "@/lib/opportunity-status";
import { hostOf } from "@/lib/links";
import { STATS, STATS_SOURCE } from "@/lib/pkm-content";
import ListingCard from "@/components/portal/ListingCard";
import LinkCard from "@/components/portal/LinkCard";
import BlogCard from "@/components/portal/BlogCard";
import GalleryMarquee from "@/components/portal/GalleryMarquee";
import HomeTeaser from "@/components/portal/HomeTeaser";
import Reveal from "@/components/portal/Reveal";
import CountUp from "@/components/portal/CountUp";
import HeroField from "@/components/portal/motion/HeroField";
import DeadlineTicker from "@/components/portal/motion/DeadlineTicker";
import PillarTabs from "@/components/portal/PillarTabs";
import PathStepper from "@/components/portal/PathStepper";

export const dynamic = "force-dynamic";

const ICON: Record<OppType, React.ComponentType<{ className?: string }>> = {
  scholarship: Award, competition: Trophy, research: FlaskConical, career: Briefcase,
};

function Heading({ title, href, cta = "View all", sub }: { title: string; href?: string; cta?: string; sub?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        {sub && <p className="mt-1 max-w-2xl text-sm text-slate-600">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
          {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [counts, closing, latest, links, events, curated, speakers, posts, gallery] = await Promise.all([
    getTypeCounts().catch(() => ({ all: 0, byType: {} as Record<string, number> })),
    getClosingSoon(8).catch(() => []),
    getLatest(6).catch(() => []),
    prisma.resourceLink.findMany({ where: { status: "published", isFeatured: true }, orderBy: [{ order: "asc" }, { title: "asc" }], take: 6 }).catch(() => []),
    prisma.event.findMany({ where: { status: { not: "archived" } }, orderBy: { startDate: "asc" }, take: 3 }).catch(() => []),
    prisma.curatedOpportunity.findMany({ take: 6 }).catch(() => []),
    prisma.speaker.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 8 }).catch(() => []),
    prisma.blogPost.findMany({ where: { status: "published" }, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], take: 3, include: { author: { select: { id: true, name: true, avatarUrl: true } } } }).catch(() => []),
    prisma.galleryItem.findMany({ where: { isPublished: true }, orderBy: [{ order: "asc" }, { createdAt: "desc" }], take: 16 }).catch(() => []),
  ]);
  const teaser = process.env.NEXT_PUBLIC_TEASER_VIDEO_URL ?? "";
  const tickerItems = closing.map((i) => ({ slug: i.slug, title: i.title, organizer: i.organizer, days: daysLeft(i.deadline) }));

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <HeroField />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8 lg:py-24">
          <div>
            <Reveal><p className="inline-flex items-center rounded-full border border-mint/40 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">GSIC Research · ITB</p></Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Scholarships, competitions, research and careers, <span className="text-cream">checked and in one place.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                Every listing shows eligibility, documents, deadlines and how to apply. Status follows the deadline, so closed items drop down on their own. GSIC also runs the PKM Bootcamp and the Sandbox for ITB students.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <form action="/opportunities" method="get" role="search" className="mt-7 flex max-w-xl gap-2">
                <label htmlFor="home-q" className="sr-only">Search opportunities</label>
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input id="home-q" name="q" type="search" placeholder="Search by program, organizer or city" className="h-12 w-full rounded-lg border border-white/10 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mint" />
                </div>
                <button type="submit" className="h-12 rounded-lg bg-mint px-5 text-sm font-semibold text-navy transition-colors hover:bg-mint-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream">Search</button>
              </form>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-5 flex flex-wrap gap-2">
                {OPP_TYPE_ORDER.map((t) => (
                  <Link key={t} href={`/opportunities?type=${t}`} className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-mint hover:text-mint">
                    {TYPE_CONFIG[t].plural} · {counts.byType[t] ?? 0}
                  </Link>
                ))}
                <HomeTeaser videoUrl={teaser} />
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <aside aria-labelledby="closing-h" className="rounded-xl border border-white/10 bg-navy/60 p-5 backdrop-blur-sm">
              <h2 id="closing-h" className="text-sm font-semibold text-cream">Closing soon</h2>
              {closing.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Nothing is close to its deadline right now.</p>
              ) : (
                <ul className="mt-3 divide-y divide-white/10">
                  {closing.slice(0, 4).map((i) => (
                    <li key={i.id}>
                      <Link href={`/opportunities/${i.slug}`} className="flex items-center justify-between gap-3 py-3 transition-transform hover:translate-x-0.5 hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{i.title}</span>
                          <span className="block truncate text-xs text-slate-400">{i.organizer}</span>
                        </span>
                        <span className="shrink-0 rounded-md bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">{daysLeft(i.deadline)} {daysLeft(i.deadline) === 1 ? "day" : "days"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </Reveal>
        </div>
        <DeadlineTicker items={tickerItems} />
      </section>

      {/* TYPE TILES */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Heading title="Browse by type" href="/opportunities" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OPP_TYPE_ORDER.map((t, idx) => {
            const Icon = ICON[t];
            return (
              <Reveal key={t} delay={idx * 0.05}>
                <Link href={`/opportunities?type=${t}`} className="group block h-full rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{TYPE_CONFIG[t].label}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{TYPE_CONFIG[t].blurb}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                    <span className="rounded-md bg-mint-100 px-1.5 py-0.5 text-mint-800">{counts.byType[t] ?? 0} open</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ABOUT GSIC RESEARCH */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">About GSIC Research</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">The research arm of the Ganesha Students Innovation Center</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                GSIC Research helps ITB students find opportunities, learn how research and PKM proposals are written, and meet people to build with. It runs three programs: Connection, the PKM Bootcamp and the Sandbox.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Each bootcamp session starts with a pre-test and ends with a post-test. Your scores are saved to your report card, so you can see what changed.
              </p>
              <Link href="/about" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">Read more <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </Reveal>
            <Reveal delay={0.1}><PillarTabs /></Reveal>
          </div>
        </div>
      </section>

      {/* PKM PATH */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-mint">PKM</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">From idea to national PKM, in four stages</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Select a stage to see what happens in it.</p>
            </div>
            <Link href="/pkm" className="inline-flex items-center gap-1 text-sm font-semibold text-mint hover:text-mint-300">Open the PKM guide <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <PathStepper dark />
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-slate-400">{s.label} <span className="text-slate-500">({s.note})</span></dt>
                <dd className="mt-1 font-display text-3xl font-extrabold text-cream">
                  {"to" in s ? <><CountUp value={s.value} />{"suffix" in s ? s.suffix : ""} <span className="text-slate-500">to</span> <CountUp value={s.to} />{"suffix" in s ? s.suffix : ""}</> : <CountUp value={s.value} />}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-slate-500">{STATS_SOURCE}</p>
        </div>
      </section>

      {/* LATEST */}
      {latest.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Heading title="Newest opportunities" href="/opportunities?sort=newest" />
          <div className="grid gap-4 lg:grid-cols-2">{latest.map((i) => <ListingCard key={i.id} item={i} compact />)}</div>
        </section>
      )}

      {/* GALLERY */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Heading title="Gallery" href="/gallery" cta="Open the gallery" sub="Photos from bootcamps, sandboxes and community days." />
          {gallery.length > 0 ? (
            <GalleryMarquee items={gallery} />
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Event photos will show here once an admin uploads them in Admin, Gallery.</p>
          )}
        </div>
      </section>

      {/* LINKS */}
      {links.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Heading title="GSIC link picks" href="/links" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {links.map((l) => <LinkCard key={l.id} link={l} host={hostOf(l.url)} />)}
          </div>
        </section>
      )}

      {/* EVENTS */}
      {events.length > 0 && (
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-display text-xl font-bold sm:text-2xl">GSIC programs</h2>
              <Link href="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-mint hover:text-mint-300">All programs <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {events.map((e) => (
                <Link key={e.id} href={e.type === "sandbox" ? "/events/sandbox" : "/events/pkm-bootcamp"} className="rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:-translate-y-1 hover:border-mint/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint">
                  <span className="rounded-md bg-cream px-2 py-0.5 text-xs font-semibold capitalize text-navy">{e.type}</span>
                  <h3 className="mt-3 text-base font-semibold">{e.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-300">{e.shortDescription}</p>
                  <ul className="mt-4 space-y-1 text-xs text-slate-400">
                    <li className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{formatDate(e.startDate.toISOString())}</li>
                    <li className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{e.location}</li>
                    <li className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden="true" />{e.currentParticipants}/{e.maxParticipants} participants</li>
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CURATED */}
      {curated.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Heading title="Plan ahead" sub="Yearly programs that usually open in a fixed month. Start preparing early." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {curated.map((c) => (
              <article key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-cream-100 px-2 py-0.5 text-xs font-semibold text-slate-800">{c.monthOpen}</span>
                  <span className="text-xs text-slate-500">{TYPE_CONFIG[c.type as OppType]?.label ?? c.type}</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{c.title}</h3>
                <p className="text-xs text-slate-500">{c.organizer}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{c.description}</p>
                {c.link && <a href={c.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline">Official site</a>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* SPEAKERS */}
      {speakers.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <Heading title="Speakers and mentors" />
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {speakers.map((s) => (
                <li key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.avatarUrl} alt="" width={64} height={64} loading="lazy" className="mx-auto h-16 w-16 rounded-full border border-slate-200 object-cover" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-600">{s.roleTitle}</p>
                  <p className="text-xs text-slate-500">{s.institution}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* BLOG */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Heading title="From the blog" href="/blog" />
          <div className="grid gap-4 md:grid-cols-3">{posts.map((p) => <BlogCard key={p.id} post={p} />)}</div>
        </section>
      )}

      {/* PRINCIPLES */}
      <section className="border-t border-slate-200 bg-cream-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            { icon: BookOpen, t: "Checked", d: "Each listing carries criteria, documents and application steps you can verify at the source." },
            { icon: CalendarDays, t: "Current", d: "Status is calculated from the deadline. Closed items move down and fade out." },
            { icon: Users, t: "Run by students", d: "GSIC members and alumni keep the directory and run the programs." },
          ].map(({ icon: I, t, d }) => (
            <div key={t}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint-100 text-mint-800"><I className="h-5 w-5" /></span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{t}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
