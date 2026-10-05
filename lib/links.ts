import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { LINK_CATEGORIES } from "@/lib/validation/opportunity";

export function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

export async function getLinkData(opts: { q?: string; category?: string }) {
  const base: Prisma.ResourceLinkWhereInput = { status: "published" };
  const where: Prisma.ResourceLinkWhereInput = {
    ...base,
    ...(opts.category ? { category: opts.category } : {}),
    ...(opts.q
      ? { OR: [
          { title: { contains: opts.q, mode: "insensitive" } },
          { description: { contains: opts.q, mode: "insensitive" } },
          { url: { contains: opts.q, mode: "insensitive" } },
          { tags: { has: opts.q } },
        ] }
      : {}),
  };
  const [links, grouped] = await Promise.all([
    prisma.resourceLink.findMany({ where, orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { title: "asc" }] }),
    prisma.resourceLink.groupBy({ by: ["category"], where: base, _count: { _all: true } }),
  ]);
  const counts: Record<string, number> = Object.fromEntries(grouped.map((g) => [g.category, g._count._all]));
  const known = LINK_CATEGORIES.filter((c) => counts[c]);
  const extra = Object.keys(counts).filter((c) => !(LINK_CATEGORIES as readonly string[]).includes(c)).sort();
  return { links, counts, categories: [...known, ...extra], total: Object.values(counts).reduce((a, b) => a + b, 0) };
}
