import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ListingCard from "@/components/portal/ListingCard";
import FilterSidebar from "@/components/portal/FilterSidebar";
import SearchBox from "@/components/portal/SearchBox";
import SortSelect from "@/components/portal/SortSelect";
import Pagination from "@/components/portal/Pagination";
import EmptyState from "@/components/portal/EmptyState";
import { parseFilters, toQueryString } from "@/lib/opportunity-query";
import { getTypeCounts, queryOpportunities } from "@/lib/opportunities";
import TypeTabs from "@/components/portal/TypeTabs";
import { TYPE_CONFIG, isOppType } from "@/lib/opportunity-config";

export const metadata: Metadata = {
  title: "Peluang — Beasiswa, Kompetisi & Research Grant · GSIC Hub",
  description: "Direktori beasiswa, kompetisi, dan research grant untuk mahasiswa ITB. Filter berdasarkan jenjang, tipe, dan benefit.",
};

// Status is derived from `now`, so never serve a build-time snapshot.
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function OpportunitiesPage({ searchParams }: { searchParams: SP }) {
  const filters = parseFilters(searchParams);
  const [result, counts] = await Promise.all([queryOpportunities(filters), getTypeCounts()]);
  const { page: _page, ...rest } = filters;
  const baseQuery = toQueryString(rest);
  const activeType = filters.type.length === 1 ? filters.type[0]! : "";
  const { type: _type, ...withoutType } = rest;
  const tabQuery = toQueryString(withoutType);
  const heading = activeType && isOppType(activeType) ? TYPE_CONFIG[activeType] : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">{heading ? heading.plural : "Peluang"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          {heading ? heading.blurb : "Beasiswa, kompetisi, research grant, dan karier yang dikurasi GSIC."} Peluang yang sudah ditutup otomatis berada di bagian bawah daftar.
        </p>
      </header>

      <Suspense>
        <div className="mb-8"><TypeTabs active={activeType} query={tabQuery} counts={counts} /></div>
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <FilterSidebar filters={filters} facets={result.facets} total={result.total} />

          <section aria-label="Daftar peluang" className="min-w-0 lg:col-start-2 lg:row-start-1">
            <div className="flex flex-col gap-3 sm:flex-row">
              <SearchBox label="Cari peluang" placeholder="Cari beasiswa, kompetisi, penyelenggara…" value={filters.q} />
              <SortSelect value={filters.sort} />
            </div>
            <p className="mt-3 text-sm text-slate-500" aria-live="polite">
              Menampilkan <span className="font-medium text-slate-700">{result.total}</span> peluang
            </p>

            <div className="mt-4 space-y-4">
              {result.items.length === 0 ? (
                <EmptyState title="Tidak ada peluang yang cocok" hint="Coba ubah kata kunci atau kurangi filter yang aktif.">
                  <Link href="/opportunities" className="text-sm font-medium text-brand-700 hover:underline">
                    Reset semua filter
                  </Link>
                </EmptyState>
              ) : (
                result.items.map((item) => <ListingCard key={item.id} item={item} />)
              )}
            </div>

            <Pagination page={result.page} pageCount={result.pageCount} basePath="/opportunities" query={baseQuery} />
          </section>
        </div>
      </Suspense>
    </main>
  );
}
