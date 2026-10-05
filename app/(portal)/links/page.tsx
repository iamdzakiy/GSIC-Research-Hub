import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Star } from "lucide-react";
import SearchBox from "@/components/portal/SearchBox";
import LinkCard from "@/components/portal/LinkCard";
import EmptyState from "@/components/portal/EmptyState";
import TagBadge from "@/components/portal/TagBadge";
import { getLinkData, hostOf } from "@/lib/links";

export const metadata: Metadata = {
  title: "Links: Scholarships, Research, Careers and Tools · GSIC Hub",
  description: "Selected links for students: scholarship portals, journals, internships, templates and communities.",
};
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function LinksPage({ searchParams }: { searchParams: SP }) {
  const q = first(searchParams.q).trim().slice(0, 100);
  const category = first(searchParams.category).trim().slice(0, 60);
  const { links, counts, categories, total } = await getLinkData({ q, category });

  const filtering = !!(q || category);
  const featured = filtering ? [] : links.filter((l) => l.isFeatured);
  const rest = filtering ? links : links.filter((l) => !l.isFeatured);
  const byCat = categories.map((c) => ({ c, items: rest.filter((l) => l.category === c) })).filter((g) => g.items.length);
  const chipHref = (c: string) => { const p = new URLSearchParams(); if (q) p.set("q", q); if (c) p.set("category", c); const s = p.toString(); return s ? `/links?${s}` : "/links"; };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">Links</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Links selected by the GSIC team: scholarship portals, research journals and repositories, internship platforms, templates and communities. {total > 0 && <>There are currently <span className="font-medium text-slate-800">{total}</span> links.</>}</p>
      </header>

      <Suspense><SearchBox label="Search links" placeholder="Search by site name, topic or tag…" value={q} /></Suspense>

      <nav aria-label="Link categories" className="mt-4 flex flex-wrap gap-2">
        <TagBadge tag="All" hash={false} count={total} href={chipHref("")} active={!category} className="px-2.5 py-1.5 text-sm" />
        {categories.map((c) => <TagBadge key={c} tag={c} hash={false} count={counts[c]} href={chipHref(c)} active={category === c} className="px-2.5 py-1.5 text-sm" />)}
      </nav>

      <div className="mt-8 space-y-10">
        {links.length === 0 && (
          <EmptyState title="No matching links" hint="Try other keywords or choose a different category.">
            <Link href="/links" className="text-sm font-medium text-brand-700 hover:underline">Clear search</Link>
          </EmptyState>
        )}

        {featured.length > 0 && (
          <section aria-labelledby="featured-h">
            <h2 id="featured-h" className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 font-heading"><Star className="h-4 w-4 text-amber-500" aria-hidden="true" />GSIC picks</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{featured.map((l) => <LinkCard key={l.id} link={l} host={hostOf(l.url)} />)}</div>
          </section>
        )}

        {filtering ? (
          links.length > 0 && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{links.map((l) => <LinkCard key={l.id} link={l} host={hostOf(l.url)} />)}</div>
        ) : (
          byCat.map((g) => (
            <section key={g.c} aria-labelledby={`c-${g.c}`}>
              <h2 id={`c-${g.c}`} className="mb-4 flex items-baseline gap-2 border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900 font-heading">{g.c}<span className="text-sm font-normal text-slate-400">{g.items.length}</span></h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{g.items.map((l) => <LinkCard key={l.id} link={l} host={hostOf(l.url)} />)}</div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
