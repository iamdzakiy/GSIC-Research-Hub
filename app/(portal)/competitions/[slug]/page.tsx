import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, ExternalLink, Plus } from "lucide-react";
import { getCompetition } from "@/lib/competition-data";
import { postsForCompetition } from "@/lib/partners";
import { categoryLabel, closesLabel, wibDateLong, wibTime } from "@/lib/competitions";
import { formatPlace } from "@/lib/opportunity-config";
import { stripToText } from "@/lib/content";
import Prose from "@/components/portal/Prose";
import SaveButton from "@/components/portal/detail/SaveButton";
import Countdown from "@/components/hub/Countdown";
import ShareWhatsApp from "@/components/hub/ShareWhatsApp";
import GuidebookButton from "@/components/hub/GuidebookButton";
import PartnerCard from "@/components/hub/PartnerCard";
import CampusSilhouette from "@/components/hub/CampusSilhouette";
import { btnPrimary, btnSecondary } from "@/components/hub/buttons";

export const dynamic = "force-dynamic";
type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCompetition(decodeURIComponent(params.slug)).catch(() => null);
  if (!c) return { title: "Competition not found · GSIC Hub" };
  const desc = [c.category && categoryLabel(c.category), c.theme, `Registration closes ${wibDateLong(c.deadline)}`].filter(Boolean).join(" · ");
  return { title: `${c.title} · Competitions · GSIC Hub`, description: desc, openGraph: { title: c.title, description: desc, images: c.posterUrl ? [c.posterUrl] : undefined } };
}

const team = (min: number | null, max: number | null) => (max === 1 ? "Individual" : min && max ? (min === max ? `${max} people` : `${min} to ${max} people`) : max ? `Up to ${max}` : null);

export default async function CompetitionPage({ params }: Props) {
  const c = await getCompetition(decodeURIComponent(params.slug)).catch(() => null);
  if (!c) notFound();
  const posts = await postsForCompetition(c.id).catch(() => []);
  const closed = closesLabel(c.deadline).closed;
  const place = formatPlace(c.city, c.country, c.location);
  const size = team(c.teamSizeMin, c.teamSizeMax);
  const summary = c.summary || stripToText(c.description).slice(0, 220);

  const facts = [
    ["Registration closes", `${wibDateLong(c.deadline)}, ${wibTime(c.deadline)} WIB`],
    c.submissionDeadline && ["Submission due", `${wibDateLong(c.submissionDeadline)}, ${wibTime(c.submissionDeadline)} WIB`],
    c.category && ["Category", categoryLabel(c.category)],
    size && ["Team size", size],
    ["Fee", c.registrationFee || "Not stated"],
    place && ["Where", place],
    c.levels.length > 0 && ["Level", c.levels.join(", ")],
  ].filter(Boolean) as [string, string][];

  return (
    <main className="pb-24 md:pb-12">
      <header className="relative overflow-hidden bg-navy text-white">
        <div className="bp-grid-dark absolute inset-0" aria-hidden="true" />
        <CampusSilhouette draw className="pointer-events-none absolute -bottom-1 right-0 hidden w-[560px] text-brand-400/40 md:block" strokeWidth={1.2} />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6">
          <Link href="/competitions" className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Competitions</Link>
          <div className="rise mt-6 flex flex-wrap items-center gap-2">
            {c.category && <span className="label-mono rounded bg-mint px-1.5 py-0.5 text-navy">{categoryLabel(c.category)}</span>}
            <span className="text-sm text-slate-300">{c.organizer}</span>
          </div>
          <h1 className="rise mt-3 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{c.title}</h1>
          {c.theme && <p className="rise mt-4 max-w-2xl border-l-2 border-mint pl-4 text-lg leading-8 text-cream">{c.theme}</p>}
          <p className="mt-6 text-lg"><Countdown deadline={c.deadline} className="!text-white" /></p>
          <div className="mt-6 flex flex-wrap gap-2">
            {c.link && !closed ? (
              <a href={c.link} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} bg-mint text-navy hover:bg-mint-300`}>Register <ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
            ) : (
              <span className="inline-flex h-11 items-center rounded-lg bg-white/10 px-5 text-sm font-medium text-slate-300">{closed ? "Registration closed" : "Link coming soon"}</span>
            )}
            {c.guidebookUrl && <GuidebookButton url={c.guidebookUrl} title={c.title} />}
          </div>
        </div>
      </header>

      <div className="mx-auto mt-8 grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
            {facts.map(([k, v]) => <div key={k}><dt className="label-mono text-ink-3">{k}</dt><dd className="mt-1 text-sm font-semibold text-ink">{v}</dd></div>)}
          </dl>

          <section aria-labelledby="partners-h">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="partners-h" className="font-display text-xl font-semibold text-ink">Seeking partner for this</h2>
                <p className="mt-1 text-sm text-ink-3">{posts.length ? `${posts.length} open ${posts.length === 1 ? "post" : "posts"}` : "No one has posted yet. Start the team."}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/partners/new?competition=${c.id}`} className={btnSecondary}><Plus className="h-4 w-4" aria-hidden="true" />I need a partner for this</Link>
                {posts.length > 0 && <Link href={`/partners?competition=${c.slug}`} className="inline-flex h-11 items-center px-2 text-sm font-medium text-brand-700 hover:underline">See all</Link>}
              </div>
            </div>
            {posts.length > 0 && <ul className="mt-4 grid gap-4 sm:grid-cols-2">{posts.map((p) => <li key={p.id}><PartnerCard p={p} compact /></li>)}</ul>}
          </section>

          <section aria-labelledby="about-h">
            <h2 id="about-h" className="font-display text-xl font-semibold text-ink">About</h2>
            <div className="mt-3">{c.description ? <Prose content={c.description} /> : <p className="text-sm text-ink-3">{summary || "Details are in the guidebook."}</p>}</div>
            {c.eligibility && <><h3 className="mt-8 font-display text-lg font-semibold text-ink">Who can join</h3><div className="mt-2"><Prose content={c.eligibility} /></div></>}
            {c.howToApply && <><h3 className="mt-8 font-display text-lg font-semibold text-ink">How to register</h3><div className="mt-2"><Prose content={c.howToApply} /></div></>}
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="label-mono text-ink-3">Keep track</p>
            <div className="mt-3 flex flex-col gap-2">
              <SaveButton opportunityId={c.id} next={`/competitions/${c.slug}`} />
              <a href={`/api/opportunities/${c.slug}/ics`} className={btnSecondary}><CalendarPlus className="h-4 w-4" aria-hidden="true" />Add deadline to calendar</a>
              <ShareWhatsApp text={`${c.title} · registration closes ${wibDateLong(c.deadline)}`} path={`/competitions/${c.slug}`} className="h-11 justify-center" />
            </div>
          </div>
          {(c.contactEmail || c.cpName || c.cpContact) && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <p className="label-mono text-ink-3">Contact</p>
              {c.cpName && <p className="mt-2 font-medium text-ink">{c.cpName}</p>}
              {c.cpContact && <p className="text-ink-2">{c.cpContact}</p>}
              {c.contactEmail && <a href={`mailto:${c.contactEmail}`} className="text-brand-700 hover:underline">{c.contactEmail}</a>}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
