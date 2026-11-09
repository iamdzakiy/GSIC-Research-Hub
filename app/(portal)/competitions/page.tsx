import type { Metadata } from "next";
import Link from "next/link";
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
      <header className="relative overflow-hidden border-b border-slate-200 bg-paper">
        <div className="bp-grid bp-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-mono text-brand-700">Competitions</p>
              <h1 className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-[-0.03em] text-ink sm:text-7xl">What closes <span className="outline-brand">next.</span></h1>
              <p className="mt-2 max-w-xl text-[15px] leading-7 text-ink-3">Sorted by when registration closes, in WIB. Every card has the guidebook and the people looking for partners.</p>
            </div>
            <Link href="/competitions/submit" className={btnSecondary}><Plus className="h-4 w-4" aria-hidden="true" /> Submit a competition</Link>
          </div>
          <div className="mt-8"><Suspense><CompetitionFilters counts={counts} /></Suspense></div>
        </div>
      </header>

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
