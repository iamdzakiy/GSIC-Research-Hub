import Link from "next/link";
import { Clock } from "lucide-react";
import TagBadge from "@/components/portal/TagBadge";
import { excerptOf, formatDateLong, readingTimeMinutes } from "@/lib/content";
import type { BlogListItem } from "@/lib/blog";

export default function BlogCard({ post }: { post: BlogListItem }) {
  const rt = readingTimeMinutes(post.content);
  const author = post.author?.name || "GSIC Team";
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300">
      {post.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" loading="lazy" className="aspect-[16/9] w-full border-b border-slate-200 object-cover" />
      ) : (
        <div className="aspect-[16/9] w-full border-b border-slate-200 bg-gradient-to-br from-brand-50 to-slate-100" aria-hidden="true" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-base font-semibold leading-snug tracking-tight text-slate-900 font-heading">
          {/* stretched link: whole card clickable while tag links stay independent */}
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-brand-700 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-600 focus-visible:after:rounded-xl">
            {post.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{excerptOf(post)}</p>

        {post.tags.length > 0 && (
          <div className="relative z-10 mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((t) => (
              <TagBadge key={t} tag={t} href={`/blog?tag=${encodeURIComponent(t.replace(/^#+/, ""))}`} />
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-5 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{author}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={(post.publishedAt ?? post.createdAt).toISOString()}>{formatDateLong(post.publishedAt ?? post.createdAt)}</time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden="true" />{rt} min read</span>
        </div>
      </div>
    </article>
  );
}
