import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/hub/PageHero";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { listCompetitions, parseCompetitionFilters } from "@/lib/competition-data";
import CompetitionCard from "@/components/hub/CompetitionCard";
import CompetitionFilters from "@/components/hub/CompetitionFilters";
import Blank from "@/components/hub/Blank";
import { btnSecondary } from "@/components/hub/buttons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Competitions · GSIC Hub",
  description: "BCC, BPC, case competitions, hackathons, LKTI and more for ITB students. Sorted by when registration closes, with guidebooks and partner posts.",
};

type Props = { searchParams: Record<string, string | string[] | undefined> };

export default async function CompetitionsPage({ searchParams }: Props) {
  const f = parseCompetitionFilters(searchParams);
  const { items, counts, total } = await listCompetitions(f).catch(() => ({ items: [], counts: {}, total: 0 }));

  return (
    <main>
      <PageHero kicker="Competitions" title={<>What closes <span className="outline-cream">next.</span></>}
        actions={<Link href="/competitions/submit" className="inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-semibold text-navy hover:bg-mint-100"><Plus className="h-4 w-4" aria-hidden="true" /> Submit a competition</Link>}>
        Sorted by when registration closes, in WIB. Every card has the guidebook and the people looking for partners.
      </PageHero>
      <div className="border-b border-slate-200 bg-paper"><div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8"><Suspense><CompetitionFilters counts={counts} /></Suspense></div></div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-live="polite">
        <p className="mb-4 text-sm text-ink-3"><span className="tnum font-semibold text-ink">{total}</span> {total === 1 ? "competition" : "competitions"}</p>
        {items.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((c) => <li key={c.id}><CompetitionCard c={c} /></li>)}</ul>
        ) : (
          <Blank title="Nothing matches these filters" hint="Try a wider time range or fewer categories. Know a competition that is missing? Submit it and we will review it.">
            <Link href="/competitions" className={btnSecondary}>Clear filters</Link>
            <Link href="/competitions/submit" className={btnSecondary}>Submit a competition</Link>
          </Blank>
        )}
      </section>
    </main>
  );
}
