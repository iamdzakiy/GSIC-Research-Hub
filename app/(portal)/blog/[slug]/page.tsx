import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import Prose from "@/components/portal/Prose";
import TagBadge from "@/components/portal/TagBadge";
import BlogCard from "@/components/portal/BlogCard";
import ReadingProgress from "@/components/blog/ReadingProgress";
import ArticleToc from "@/components/blog/ArticleToc";
import ArticleEnhancer from "@/components/blog/ArticleEnhancer";
import SeriesPanel from "@/components/blog/SeriesPanel";
import ShareBar from "@/components/blog/ShareBar";
import QuizCard from "@/components/blog/QuizCard";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { episodeFromSlug, getEpisodeQuiz, getSeriesParts } from "@/lib/blog-series";
import { excerptOf, formatDateLong, readingTimeMinutes } from "@/lib/content";
import { renderArticle } from "@/lib/render-content";
import { siteBase } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug).catch(() => null);
  if (!post) return { title: "Article not found · GSIC Hub" };
  // The share image comes from ./opengraph-image.tsx (the cover rasterised, with the title). SVG covers are not accepted by WhatsApp or most social previews.
  return {
    title: `${post.title} · GSIC Hub`,
    description: excerptOf(post),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: excerptOf(post), type: "article", locale: post.lang === "id" ? "id_ID" : "en_US", publishedTime: (post.publishedAt ?? post.createdAt).toISOString() },
    twitter: { card: "summary_large_image", title: post.title, description: excerptOf(post) },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug).catch(() => null);
  if (!post) notFound();
  const [related, parts] = await Promise.all([
    getRelatedPosts(post, 3).catch(() => []),
    post.series ? getSeriesParts(post.series).catch(() => []) : Promise.resolve([]),
  ]);
  const episode = post.series ? episodeFromSlug(post.slug) : null;
  const quiz = episode ? await getEpisodeQuiz(episode).catch(() => null) : null;
  const { html, toc } = renderArticle(post.content, { lang: post.lang });
  const when = post.publishedAt ?? post.createdAt;
  const author = post.author?.name || "GSIC Team";
  const tagHref = (t: string) => `/blog?tag=${encodeURIComponent(t.replace(/^#+/, ""))}`;
  const partIdx = parts.findIndex((p) => p.slug === post.slug);
  const seriesLabel = post.series && partIdx >= 0 ? `${post.series} · Part ${partIdx + 1} of ${parts.length}` : post.series;
  const base = siteBase();
  const url = new URL(`/blog/${post.slug}`, base).toString();
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: post.title, description: excerptOf(post), inLanguage: post.lang,
    datePublished: when.toISOString(), dateModified: post.updatedAt.toISOString(), mainEntityOfPage: url,
    author: { "@type": "Person", name: author }, publisher: { "@type": "Organization", name: "GSIC Hub" },
    image: [new URL(`/blog/${post.slug}/opengraph-image`, base).toString()],
    ...(post.series ? { isPartOf: { "@type": "CreativeWorkSeries", name: post.series } } : {}),
  };

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <ReadingProgress />
      <ArticleEnhancer slug={post.slug} series={post.series} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-5xl">
        <Link href="/blog" className="print:hidden inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All articles
        </Link>

        <header className="mt-6 max-w-3xl">
          {seriesLabel && <p className="label-mono mb-3 text-brand-700">{seriesLabel}</p>}
          {post.tags.length > 0 && (
            <div className="print:hidden mb-4 flex flex-wrap gap-1.5">
              {post.tags.map((t) => <TagBadge key={t} tag={t} href={tagHref(t)} />)}
            </div>
          )}
          <h1 lang={post.lang} className="text-3xl font-bold leading-tight tracking-tight text-slate-900 font-heading sm:text-4xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{author}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={when.toISOString()}>{formatDateLong(when)}</time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{readingTimeMinutes(post.content)} min read</span>
          </div>
          <div className="mt-5"><ShareBar title={post.title} /></div>
        </header>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt="" width={1600} height={900} className="mt-8 aspect-[16/9] w-full rounded-xl border border-slate-200 object-cover" />
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
          <article className="min-w-0 max-w-3xl">
            <div className="mb-6 lg:hidden"><ArticleToc items={toc} /></div>
            <Prose id="article-body" html={html} lang={post.lang} className="prose-lg" />
            <div id="article-end" aria-hidden="true" />

            {quiz && <QuizCard quiz={quiz} />}

            {post.tags.length > 0 && (
              <footer className="print:hidden mt-10 border-t border-slate-200 pt-6">
                <p className="mb-3 text-sm font-medium text-slate-700">Related topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((t) => <TagBadge key={t} tag={t} href={tagHref(t)} />)}
                </div>
              </footer>
            )}
          </article>

          <div className="print:hidden space-y-6">
            <div className="hidden lg:block"><ArticleToc items={toc} /></div>
            {post.series && parts.length > 1 && <SeriesPanel series={post.series} parts={parts.map((p) => ({ slug: p.slug, title: p.title }))} current={post.slug} />}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="print:hidden mx-auto mt-16 max-w-7xl border-t border-slate-200 pt-10">
          <h2 id="related" className="mb-6 text-xl font-bold tracking-tight text-slate-900 font-heading">Related articles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <BlogCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </main>
  );
}
