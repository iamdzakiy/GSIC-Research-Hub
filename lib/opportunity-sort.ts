// ============================================================
// Pure listing logic (no DB / no server-only) — unit-testable.
// ============================================================
import type { DisplayStatus } from "@/lib/opportunity-status";

export interface ListingItem {
  id: string;
  slug: string;
  title: string;
  organizer: string;
  type: string;
  scope: string;
  levels: string[];
  benefits: string[];
  benefitCategories: string[];
  openDate: string | null;
  deadline: string;
  quota: number | null;
  city: string | null;
  country: string | null;
  fundingType: string | null;
  fundingAmount: string | null;
  attendanceMode: string | null;
  summary: string | null;
  status: DisplayStatus;
  createdAt: string;
}

export interface FacetCounts {
  level: Record<string, number>;
  type: Record<string, number>;
  scope: Record<string, number>;
  benefit: Record<string, number>;
  funding: Record<string, number>;
  mode: Record<string, number>;
  status: Record<string, number>;
}

export type SortKey = "deadline" | "newest" | "quota";

const t = (s: string) => +new Date(s);
const byDeadlineAsc = (a: ListingItem, b: ListingItem) => t(a.deadline) - t(b.deadline);

const SORTERS: Record<SortKey, (a: ListingItem, b: ListingItem) => number> = {
  deadline: byDeadlineAsc,
  newest: (a, b) => t(b.createdAt) - t(a.createdAt),
  quota: (a, b) => (b.quota ?? -1) - (a.quota ?? -1) || byDeadlineAsc(a, b),
};

/**
 * Open / closing / upcoming items first (ordered by `sort`), then every closed
 * item (most recently closed first). Closed items therefore sink to the bottom
 * automatically — no archive page, no manual action.
 */
export function orderListings(items: ListingItem[], sort: SortKey): ListingItem[] {
  const live = items.filter((i) => i.status !== "closed").sort(SORTERS[sort]);
  const closed = items.filter((i) => i.status === "closed").sort((a, b) => -byDeadlineAsc(a, b));
  return [...live, ...closed];
}

export function countFacets(items: ListingItem[]): FacetCounts {
  const f: FacetCounts = { level: {}, type: {}, scope: {}, benefit: {}, funding: {}, mode: {}, status: {} };
  const bump = (m: Record<string, number>, k: string) => (m[k] = (m[k] ?? 0) + 1);
  for (const i of items) {
    i.levels.forEach((l) => bump(f.level, l));
    bump(f.type, i.type);
    bump(f.scope, i.scope);
    i.benefitCategories.forEach((b) => bump(f.benefit, b));
    if (i.fundingType) bump(f.funding, i.fundingType);
    if (i.attendanceMode) bump(f.mode, i.attendanceMode);
    bump(f.status, i.status);
  }
  return f;
}
