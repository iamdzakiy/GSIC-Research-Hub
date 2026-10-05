// ============================================================
// Blog queries (server only) — tag recall & related content
// ============================================================
import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const BLOG_PAGE_SIZE = 9;

/** "#ResearchTips" / "research tips" -> "researchtips" (comparison key). */
export const tagKey = (t: string) => t.trim().replace(/^#+/, "").replace(/\s+/g, "").toLowerCase();
/** Display form without the hash, e.g. "ResearchTips". */
export const tagLabel = (t: string) => t.trim().replace(/^#+/, "").replace(/\s+/g, "");

const AUTHOR = { select: { id: true, name: true, avatarUrl: true } } as const;

export type BlogListItem = Prisma.BlogPostGetPayload<{ include: { author: typeof AUTHOR } }>;

export interface TagCount { tag: string; count: number }

/** Canonical tag list with counts (case/hash-insensitive merge), most used first. */
export async function getTagCounts(): Promise<{ tags: TagCount[]; variants: Map<string, string[]> }> {
  try {
  const rows = await prisma.blogPost.findMany({ where: { status: "published" }, select: { tags: true } });
  const counts = new Map<string, { label: string; count: number }>();
  const variants = new Map<string, Set<string>>();
  for (const r of rows) {
    const seen = new Set<string>();
    for (const raw of r.tags ?? []) {
      const key = tagKey(raw);
      if (!key) continue;
      (variants.get(key) ?? variants.set(key, new Set()).get(key)!).add(raw);
      if (seen.has(key)) continue;
      seen.add(key);
      const cur = counts.get(key);
      counts.set(key, { label: cur?.label ?? tagLabel(raw), count: (cur?.count ?? 0) + 1 });
    }
  }
  const tags = [...counts.values()]
    .map((v) => ({ tag: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  return { tags, variants: new Map([...variants].map(([k, v]) => [k, [...v]])) };
  } catch (e) {
    console.error("[getTagCounts] DB unavailable:", e);
    return { tags: [], variants: new Map() };
  }
}

export async function listPosts(opts: { q?: string; tag?: string; page?: number; variants: Map<string, string[]> }) {
  try {
  const tagVariants = opts.tag ? opts.variants.get(tagKey(opts.tag)) ?? [] : [];
  const where: Prisma.BlogPostWhereInput = {
    status: "published",
    ...(opts.tag ? { tags: { hasSome: tagVariants.length ? tagVariants : ["\u0000none"] } } : {}),
    ...(opts.q
      ? {
          OR: [
            { title: { contains: opts.q, mode: "insensitive" } },
            { excerpt: { contains: opts.q, mode: "insensitive" } },
            { content: { contains: opts.q, mode: "insensitive" } },
            { tags: { hasSome: [opts.q, `#${opts.q}`] } },
          ],
        }
      : {}),
  };
  const total = await prisma.blogPost.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);
  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * BLOG_PAGE_SIZE,
    take: BLOG_PAGE_SIZE,
    include: { author: AUTHOR },
  });
  return { posts, total, page, pageCount };
  } catch (e) {
    console.error("[listPosts] DB unavailable:", e);
    return { posts: [] as BlogListItem[], total: 0, page: 1, pageCount: 1 };
  }
}

export async function getPostBySlug(slug: string) {
  try {
    return await prisma.blogPost.findFirst({ where: { slug, status: "published" }, include: { author: AUTHOR } });
  } catch (e) {
    console.error("[getPostBySlug] DB unavailable:", e);
    return null;
  }
}

/**
 * Related articles = most shared tags first, newest as tie-breaker; topped up
 * with the latest posts so the section is never empty on a sparse blog.
 */
export async function getRelatedPosts(post: { id: string; tags: string[] }, limit = 3): Promise<BlogListItem[]> {
  try {
  const keys = new Set((post.tags ?? []).map(tagKey).filter(Boolean));
  const candidates = await prisma.blogPost.findMany({
    where: { status: "published", id: { not: post.id } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 60,
    include: { author: AUTHOR },
  });
  const scored = candidates
    .map((c, i) => ({ c, i, score: (c.tags ?? []).reduce((n, t) => n + (keys.has(tagKey(t)) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
  const shared = scored.filter((s) => s.score > 0).map((s) => s.c);
  const rest = scored.filter((s) => s.score === 0).map((s) => s.c);
  return [...shared, ...rest].slice(0, limit);
  } catch (e) {
    console.error("[getRelatedPosts] DB unavailable:", e);
    return [];
  }
}
