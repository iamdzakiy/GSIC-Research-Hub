// ============================================================
// Server-side opportunity directory queries
// ------------------------------------------------------------
// 1. Coarse DB filtering (search / type / scope / level / benefit / funding / mode).
// 2. Derived status (deadline vs. now) + status filter in memory.
// 3. Ordering: every live item first (chosen sort), every closed item last.
// ============================================================
import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getDisplayStatus } from "@/lib/opportunity-status";
import { countFacets, orderListings, type FacetCounts, type ListingItem } from "@/lib/opportunity-sort";
import { PAGE_SIZE, type OpportunityFilters } from "@/lib/opportunity-query";

export type { FacetCounts, ListingItem };

export interface DirectoryResult {
  items: ListingItem[];
  total: number;
  page: number;
  pageCount: number;
  facets: FacetCounts;
}

const LISTING_SELECT = {
  id: true, slug: true, title: true, organizer: true, type: true, scope: true,
  levels: true, benefits: true, benefitCategories: true, openDate: true,
  deadline: true, quota: true, status: true, createdAt: true,
  city: true, country: true, fundingType: true, fundingAmount: true, attendanceMode: true, summary: true,
} satisfies Prisma.OpportunitySelect;

type Row = Prisma.OpportunityGetPayload<{ select: typeof LISTING_SELECT }>;

export function toListingItem(r: Row, now: Date): ListingItem {
  return {
    id: r.id, slug: r.slug, title: r.title, organizer: r.organizer, type: r.type, scope: r.scope,
    levels: r.levels, benefits: r.benefits, benefitCategories: r.benefitCategories,
    openDate: r.openDate?.toISOString() ?? null, deadline: r.deadline.toISOString(), quota: r.quota,
    city: r.city, country: r.country, fundingType: r.fundingType, fundingAmount: r.fundingAmount,
    attendanceMode: r.attendanceMode, summary: r.summary,
    status: getDisplayStatus(r, now), createdAt: r.createdAt.toISOString(),
  };
}

export async function queryOpportunities(f: OpportunityFilters, now = new Date()): Promise<DirectoryResult> {
  const where: Prisma.OpportunityWhereInput = {
    ...(f.q
      ? {
          OR: [
            { title: { contains: f.q, mode: "insensitive" } },
            { organizer: { contains: f.q, mode: "insensitive" } },
            { description: { contains: f.q, mode: "insensitive" } },
            { city: { contains: f.q, mode: "insensitive" } },
            { country: { contains: f.q, mode: "insensitive" } },
            { tags: { has: f.q } },
          ],
        }
      : {}),
    ...(f.type.length ? { type: { in: f.type } } : {}),
    ...(f.scope.length ? { scope: { in: f.scope } } : {}),
    ...(f.level.length ? { levels: { hasSome: f.level } } : {}),
    ...(f.benefit.length ? { benefitCategories: { hasSome: f.benefit } } : {}),
    ...(f.funding.length ? { fundingType: { in: f.funding } } : {}),
    ...(f.mode.length ? { attendanceMode: { in: f.mode } } : {}),
  };

  const rows = await prisma.opportunity.findMany({ where, select: LISTING_SELECT });
  const all = rows.map((r) => toListingItem(r, now));

  const facets = countFacets(all);
  const filtered = f.status.length ? all.filter((i) => f.status.includes(i.status as never)) : all;
  const ordered = orderListings(filtered, f.sort);

  const pageCount = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const page = Math.min(f.page, pageCount);
  return { items: ordered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: ordered.length, page, pageCount, facets };
}

/** Live (not closed) opportunity counts per type — drives the type tabs & home tiles. */
export async function getTypeCounts(now = new Date()): Promise<{ all: number; byType: Record<string, number> }> {
  const rows = await prisma.opportunity.findMany({ select: { type: true, deadline: true, openDate: true, status: true } });
  const byType: Record<string, number> = {};
  let all = 0;
  for (const r of rows) {
    if (getDisplayStatus(r, now) === "closed") continue;
    all++;
    byType[r.type] = (byType[r.type] ?? 0) + 1;
  }
  return { all, byType };
}

/** Soonest-closing live items, optionally of one type. */
export async function getClosingSoon(limit = 4, now = new Date()): Promise<ListingItem[]> {
  const rows = await prisma.opportunity.findMany({
    where: { deadline: { gte: now }, status: { notIn: ["archived", "completed"] } },
    orderBy: { deadline: "asc" }, take: limit * 3, select: LISTING_SELECT,
  });
  return rows.map((r) => toListingItem(r, now)).filter((i) => i.status !== "closed" && i.status !== "upcoming").slice(0, limit);
}

export async function getLatest(limit = 6, now = new Date()): Promise<ListingItem[]> {
  const rows = await prisma.opportunity.findMany({ where: { deadline: { gte: now }, status: { notIn: ["archived", "completed"] } }, orderBy: { createdAt: "desc" }, take: limit * 2, select: LISTING_SELECT });
  return rows.map((r) => toListingItem(r, now)).filter((i) => i.status !== "closed").slice(0, limit);
}

export async function getRelatedOpportunities(o: { id: string; type: string; tags: string[]; levels: string[] }, limit = 3, now = new Date()): Promise<ListingItem[]> {
  const rows = await prisma.opportunity.findMany({
    where: { id: { not: o.id }, deadline: { gte: now }, status: { notIn: ["archived", "completed"] }, OR: [{ type: o.type as never }, ...(o.tags.length ? [{ tags: { hasSome: o.tags } }] : []), ...(o.levels.length ? [{ levels: { hasSome: o.levels } }] : [])] },
    take: 30, orderBy: { deadline: "asc" }, select: LISTING_SELECT,
  });
  const items = rows.map((r) => toListingItem(r, now)).filter((i) => i.status !== "closed");
  const score = (i: ListingItem) => (i.type === o.type ? 3 : 0) + i.levels.filter((l) => o.levels.includes(l)).length;
  return items.sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export async function getOpportunityByKey(key: string) {
  return prisma.opportunity.findFirst({ where: { OR: [{ slug: key }, { id: key }] } });
}
