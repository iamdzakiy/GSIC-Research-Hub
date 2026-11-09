import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { listPartnerPosts, parsePartnerFilters, type PartnerFilters } from "@/lib/partners";
import { COMPETITION_CATEGORIES, categoryLabel } from "@/lib/competitions";
import { prisma } from "@/lib/prisma";
import PartnerCard from "@/components/hub/PartnerCard";
import Blank from "@/components/hub/Blank";
import CampusSilhouette from "@/components/hub/CampusSilhouette";
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
      <header className="relative overflow-hidden border-b border-slate-200 bg-paper">
        <div className="bp-grid bp-fade absolute inset-0" aria-hidden="true" />
        <CampusSilhouette draw className="pointer-events-none absolute -bottom-2 right-0 hidden w-[520px] text-brand-200 lg:block" strokeWidth={1.2} />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <p className="label-mono text-brand-700">Seeking Partner</p>
          <h1 className="mt-2 max-w-2xl font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">{comp ? <>Partners for <span className="text-brand-700">{comp.title}</span></> : "Find the people your team is missing"}</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-ink-3">Each post names the competition, the roles and the skills. Respond with one role and a short note. Contacts open up for both sides after an accept.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={newHref} className={btnPrimary}><Plus className="h-4 w-4" aria-hidden="true" /> Post what you need</Link>
            <Link href="/partners/manage" className={btnSecondary}>My posts and responses</Link>
          </div>

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
        </div>
      </header>

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
