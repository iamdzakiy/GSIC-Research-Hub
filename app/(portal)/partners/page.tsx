import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/hub/PageHero";
import { Plus, Search } from "lucide-react";
import { listPartnerPosts, parsePartnerFilters, type PartnerFilters } from "@/lib/partners";
import { COMPETITION_CATEGORIES, categoryLabel } from "@/lib/competitions";
import { prisma } from "@/lib/prisma";
import PartnerCard from "@/components/hub/PartnerCard";
import Blank from "@/components/hub/Blank";
import { btnPrimary, btnSecondary, chip, input } from "@/components/hub/buttons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seeking Partner · GSIC Hub",
  description: "Teams that need a member and people looking for a team, per competition. Pick a role, respond, and get each other's contact after an accept.",
};

type Props = { searchParams: Record<string, string | string[] | undefined> };

const href = (f: PartnerFilters, patch: Partial<PartnerFilters>) => {
  const n = { ...f, ...patch };
  const q = new URLSearchParams(Object.entries(n).filter(([, v]) => v) as [string, string][]);
  const s = q.toString();
  return s ? `/partners?${s}` : "/partners";
};

export default async function PartnersPage({ searchParams }: Props) {
  const f = parsePartnerFilters(searchParams);
  const [{ items, total, kinds }, comp] = await Promise.all([
    listPartnerPosts(f).catch(() => ({ items: [], total: 0, kinds: {} as Record<string, number> })),
    f.competition ? prisma.opportunity.findFirst({ where: { OR: [{ slug: f.competition }, { id: f.competition }] }, select: { id: true, slug: true, title: true } }).catch(() => null) : null,
  ]);
  const newHref = comp ? `/partners/new?competition=${comp.id}` : "/partners/new";

  return (
    <main>
      <PageHero kicker="Seeking Partner" title={comp ? <>Partners for <span className="outline-cream">{comp.title}</span></> : <>Find the people your team <span className="outline-cream">is missing</span></>}
        actions={<><Link href={newHref} className="inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-semibold text-navy hover:bg-mint-100"><Plus className="h-4 w-4" aria-hidden="true" /> Post what you need</Link><Link href="/partners/manage" className="inline-flex items-center rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">My posts and responses</Link></>}>
        Each post names the competition, the roles and the skills. Respond with one role and a short note. Contacts open up for both sides after an accept.
      </PageHero>
      <div className="border-b border-slate-200 bg-paper"><div className="mx-auto max-w-7xl px-4 pb-5 pt-1 sm:px-6 lg:px-8">
          <form action="/partners" className="mt-8 flex max-w-xl gap-2" role="search">
            {f.kind && <input type="hidden" name="kind" value={f.kind} />}
            {f.cat && <input type="hidden" name="cat" value={f.cat} />}
            {f.competition && <input type="hidden" name="competition" value={f.competition} />}
            <label className="relative flex-1">
              <span className="sr-only">Search posts</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input name="q" defaultValue={f.q} placeholder="Role, skill or competition" className={`${input()} pl-9`} />
            </label>
            <button className={btnSecondary}>Search</button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filters">
            <Link href={href(f, { kind: undefined })} className={chip(!f.kind)}>All</Link>
            <Link href={href(f, { kind: "team_needs_member" })} className={chip(f.kind === "team_needs_member")}>Teams need members <span className="tnum opacity-70">{kinds.team_needs_member ?? 0}</span></Link>
            <Link href={href(f, { kind: "looking_for_team" })} className={chip(f.kind === "looking_for_team")}>Looking for a team <span className="tnum opacity-70">{kinds.looking_for_team ?? 0}</span></Link>
            <span className="mx-1 hidden h-5 w-px bg-slate-300 sm:block" aria-hidden="true" />
            {COMPETITION_CATEGORIES.filter((c) => c.id !== "other").map((c) => (
              <Link key={c.id} href={href(f, { cat: f.cat === c.id ? undefined : c.id })} className={chip(f.cat === c.id)} title={c.label}>{c.short}</Link>
            ))}
          </div>
      </div></div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="mb-4 text-sm text-ink-3">
          <span className="tnum font-semibold text-ink">{total}</span> open {total === 1 ? "post" : "posts"}
          {f.cat && <> in {categoryLabel(f.cat)}</>}
          {(f.cat || f.kind || f.q || f.competition) && <> · <Link href="/partners" className="font-medium text-brand-700 underline">Clear</Link></>}
        </p>
        {items.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((p) => <li key={p.id}><PartnerCard p={p} /></li>)}</ul>
        ) : (
          <Blank title={comp ? "No one has posted for this competition yet" : "No open posts match"} hint="Be the first. A clear post names the roles you need and what each one will do.">
            <Link href={newHref} className={btnSecondary}>Post what you need</Link>
          </Blank>
        )}
      </section>
    </main>
  );
}
