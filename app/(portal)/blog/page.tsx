import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import BlogCard from "@/components/portal/BlogCard";
import TagBadge from "@/components/portal/TagBadge";
import SearchBox from "@/components/portal/SearchBox";
import Pagination from "@/components/portal/Pagination";
import EmptyState from "@/components/portal/EmptyState";
import { getTagCounts, listPosts, tagKey } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Panduan Beasiswa, Riset & Kompetisi · GSIC Hub",
  description: "Tips riset, panduan beasiswa, dan persiapan kompetisi dari komunitas GSIC.",
};
export const revalidate = 120;

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BlogIndexPage({ searchParams }: { searchParams: SP }) {
  const q = first(searchParams.q).trim().slice(0, 100);
  const tagParam = first(searchParams.tag).trim().slice(0, 60);
  const page = Math.max(1, parseInt(first(searchParams.page), 10) || 1);

  const { tags, variants } = await getTagCounts();
  const activeKey = tagParam ? tagKey(tagParam) : "";
  const { posts, total, page: cur, pageCount } = await listPosts({ q, tag: tagParam, page, variants });

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (tagParam) qs.set("tag", tagParam);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">Blog</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Tips riset, panduan beasiswa, dan persiapan kompetisi dari komunitas GSIC.</p>
      </header>

      <Suspense>
        <SearchBox label="Cari artikel" placeholder="Cari artikel atau topik…" value={q} />
      </Suspense>

      <nav aria-label="Filter topik" className="mt-4 flex flex-wrap items-center gap-2">
        <TagBadge tag="Semua" hash={false} href="/blog" active={!activeKey} />
        {tags.map((t) => (
          <TagBadge key={t.tag} tag={t.tag} count={t.count} href={`/blog?tag=${encodeURIComponent(t.tag)}`} active={tagKey(t.tag) === activeKey} />
        ))}
      </nav>

      <p className="mt-6 text-sm text-slate-500" aria-live="polite">
        {total} artikel{tagParam && <> dengan topik <span className="font-medium text-slate-700">#{tagParam.replace(/^#+/, "")}</span></>}
        {q && <> untuk “<span className="font-medium text-slate-700">{q}</span>”</>}
      </p>

      <div className="mt-4">
        {posts.length === 0 ? (
          <EmptyState title="Belum ada artikel yang cocok" hint="Coba kata kunci lain atau pilih topik berbeda.">
            <Link href="/blog" className="text-sm font-medium text-brand-700 hover:underline">Lihat semua artikel</Link>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => <BlogCard key={p.id} post={p} />)}
          </div>
        )}
      </div>

      <Pagination page={cur} pageCount={pageCount} basePath="/blog" query={qs.toString()} />
    </main>
  );
}
