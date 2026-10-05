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
  title: "Kumpulan Pranala — Beasiswa, Riset, Karier & Tools · GSIC Hub",
  description: "Tautan terkurasi untuk mahasiswa: portal beasiswa, jurnal, magang, template, dan komunitas.",
};
export const revalidate = 300;

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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">Kumpulan Pranala</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Tautan terkurasi tim GSIC — portal beasiswa, jurnal & repositori riset, platform magang, template, dan komunitas. {total > 0 && <>Saat ini <span className="font-medium text-slate-800">{total}</span> tautan.</>}</p>
      </header>

      <Suspense><SearchBox label="Cari pranala" placeholder="Cari nama situs, topik, atau tag…" value={q} /></Suspense>

      <nav aria-label="Kategori pranala" className="mt-4 flex flex-wrap gap-2">
        <TagBadge tag="Semua" hash={false} count={total} href={chipHref("")} active={!category} className="px-2.5 py-1.5 text-sm" />
        {categories.map((c) => <TagBadge key={c} tag={c} hash={false} count={counts[c]} href={chipHref(c)} active={category === c} className="px-2.5 py-1.5 text-sm" />)}
      </nav>

      <div className="mt-8 space-y-10">
        {links.length === 0 && (
          <EmptyState title="Tidak ada pranala yang cocok" hint="Coba kata kunci lain atau pilih kategori berbeda.">
            <Link href="/links" className="text-sm font-medium text-brand-700 hover:underline">Reset pencarian</Link>
          </EmptyState>
        )}

        {featured.length > 0 && (
          <section aria-labelledby="featured-h">
            <h2 id="featured-h" className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 font-heading"><Star className="h-4 w-4 text-amber-500" aria-hidden="true" />Pilihan GSIC</h2>
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
