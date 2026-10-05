import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import Prose from "@/components/portal/Prose";
import TagBadge from "@/components/portal/TagBadge";
import BlogCard from "@/components/portal/BlogCard";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { excerptOf, formatDateLong, readingTimeMinutes } from "@/lib/content";

export const revalidate = 300;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Artikel tidak ditemukan · GSIC Hub" };
  return {
    title: `${post.title} · GSIC Hub`,
    description: excerptOf(post),
    openGraph: { title: post.title, description: excerptOf(post), type: "article", images: post.coverImage ? [post.coverImage] : undefined },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post, 3);
  const when = post.publishedAt ?? post.createdAt;
  const author = post.author?.name || "Tim GSIC";
  const tagHref = (t: string) => `/blog?tag=${encodeURIComponent(t.replace(/^#+/, ""))}`;

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Semua artikel
        </Link>

        <header className="mt-6">
          {post.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {post.tags.map((t) => <TagBadge key={t} tag={t} href={tagHref(t)} />)}
            </div>
          )}
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 font-heading sm:text-4xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{author}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={when.toISOString()}>{formatDateLong(when)}</time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{readingTimeMinutes(post.content)} menit baca</span>
          </div>
        </header>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt="" className="mt-8 aspect-[16/9] w-full rounded-xl border border-slate-200 object-cover" />
        )}

        <Prose content={post.content} className="mt-8 prose-lg" />

        {post.tags.length > 0 && (
          <footer className="mt-10 border-t border-slate-200 pt-6">
            <p className="mb-3 text-sm font-medium text-slate-700">Jelajahi topik terkait</p>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => <TagBadge key={t} tag={t} href={tagHref(t)} />)}
            </div>
          </footer>
        )}
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mx-auto mt-16 max-w-7xl border-t border-slate-200 pt-10">
          <h2 id="related" className="mb-6 text-xl font-bold tracking-tight text-slate-900 font-heading">Artikel Terkait</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <BlogCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </main>
  );
}
