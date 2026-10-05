// ============================================================
// URL <-> filter state for /opportunities
// ------------------------------------------------------------
//   ?q=ITB&level=S1&level=S2&type=scholarship&scope=internal
//    &benefit=Biaya%20Hidup&status=open&sort=deadline&page=2
// The URL is the single source of truth: shareable, SSR-friendly and
// back/forward-safe. Parsing is zod-validated so junk params are dropped.
// ============================================================
import { z } from "zod";
import { BENEFIT_CATEGORIES, LEVELS } from "@/lib/opportunity-status";

export const SORTS = ["deadline", "newest", "quota"] as const;
export const STATUS_FILTERS = ["open", "closing", "closed"] as const;
export const TYPES = ["scholarship", "competition", "research", "career"] as const;
export const SCOPES = ["internal", "external"] as const;
export const FUNDINGS = ["fully_funded", "partially_funded", "tuition_only", "stipend", "prize_money", "paid", "unpaid", "self_funded"] as const;
export const MODES = ["onsite", "online", "hybrid"] as const;
export const PAGE_SIZE = 12;

type Raw = Record<string, string | string[] | undefined>;

const many = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(item).catch([]));

const schema = z.object({
  q: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().trim().max(100).catch("")).default(""),
  level: many(z.enum(LEVELS)),
  type: many(z.enum(TYPES)),
  scope: many(z.enum(SCOPES)),
  benefit: many(z.enum(BENEFIT_CATEGORIES)),
  funding: many(z.enum(FUNDINGS)),
  mode: many(z.enum(MODES)),
  status: many(z.enum(STATUS_FILTERS)),
  sort: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.enum(SORTS).catch("deadline")).default("deadline"),
  page: z.preprocess((v) => Number(Array.isArray(v) ? v[0] : v), z.number().int().min(1).max(500).catch(1)).default(1),
});

export type OpportunityFilters = z.infer<typeof schema>;

export function parseFilters(raw: Raw): OpportunityFilters {
  return schema.parse(raw);
}

/** Serialise filters back to a query string (defaults omitted). */
export function toQueryString(f: Partial<OpportunityFilters>): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  for (const k of ["level", "type", "scope", "benefit", "funding", "mode", "status"] as const) {
    (f[k] ?? []).forEach((v) => p.append(k, v));
  }
  if (f.sort && f.sort !== "deadline") p.set("sort", f.sort);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  return p.toString();
}
