// Server queries for /competitions: URL filters, list with facet counts, and partner-post counts.
import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CATEGORY_IDS } from "@/lib/competitions";
import { LEVELS } from "@/lib/opportunity-status";
import type { Prisma } from "../generated/prisma/client";

type Raw = Record<string, string | string[] | undefined>;
const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);
const many = (v: unknown) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

const schema = z.object({
  q: z.preprocess(one, z.string().trim().max(100).catch("")).default(""),
  cat: z.preprocess(many, z.array(z.string()).catch([])).transform((a) => a.filter((x) => CATEGORY_IDS.includes(x))),
  within: z.preprocess(one, z.enum(["7", "30", "any"]).catch("any")).default("any"),
  team: z.preprocess(one, z.enum(["team", "solo", "any"]).catch("any")).default("any"),
  free: z.preprocess(one, z.enum(["1", ""]).catch("")).default(""),
  level: z.preprocess(many, z.array(z.enum(LEVELS)).catch([])),
  mode: z.preprocess(many, z.array(z.enum(["onsite", "online", "hybrid"])).catch([])),
  closed: z.preprocess(one, z.enum(["1", ""]).catch("")).default(""),
});
export type CompetitionFilters = z.infer<typeof schema>;
export const parseCompetitionFilters = (raw: Raw) => schema.parse(raw);

export const COMPETITION_SELECT = {
  id: true, slug: true, title: true, organizer: true, summary: true, category: true, theme: true, deadline: true, submissionDeadline: true,
  guidebookUrl: true, link: true, teamSizeMin: true, teamSizeMax: true, registrationFee: true, attendanceMode: true, levels: true, status: true, posterUrl: true,
} satisfies Prisma.OpportunitySelect;
export type CompetitionRow = Prisma.OpportunityGetPayload<{ select: typeof COMPETITION_SELECT }> & { partnerCount: number };

const isFree = (fee: string | null) => !!fee && /gratis|free|tanpa biaya|^rp ?0\b|^0$/i.test(fee.trim());

export async function listCompetitions(f: CompetitionFilters, now = new Date()) {
  const base: Prisma.OpportunityWhereInput = {
    type: "competition", isPublished: true,
    ...(f.closed ? {} : { deadline: { gt: now }, status: { notIn: ["archived", "completed"] } }),
    ...(f.q ? { OR: [{ title: { contains: f.q, mode: "insensitive" } }, { organizer: { contains: f.q, mode: "insensitive" } }, { theme: { contains: f.q, mode: "insensitive" } }, { tags: { has: f.q } }] } : {}),
    ...(f.within !== "any" ? { deadline: { gt: now, lte: new Date(now.getTime() + Number(f.within) * 86_400_000) } } : {}),
    ...(f.level.length ? { levels: { hasSome: f.level } } : {}),
    ...(f.mode.length ? { attendanceMode: { in: f.mode } } : {}),
    ...(f.team === "solo" ? { teamSizeMax: 1 } : f.team === "team" ? { OR: [{ teamSizeMax: { gt: 1 } }, { teamSizeMax: null }] } : {}),
  };
  let rows = await prisma.opportunity.findMany({ where: base, select: COMPETITION_SELECT, orderBy: { deadline: "asc" }, take: 300 });
  if (f.free) rows = rows.filter((r) => isFree(r.registrationFee));
  // Facet counts ignore the category filter itself, so chips show what selecting them would give.
  const counts: Record<string, number> = {};
  for (const r of rows) if (r.category) counts[r.category] = (counts[r.category] ?? 0) + 1;
  const list = f.cat.length ? rows.filter((r) => r.category && f.cat.includes(r.category)) : rows;
  const closedFirstLast = f.closed ? [...list.filter((r) => r.deadline > now), ...list.filter((r) => r.deadline <= now).reverse()] : list;
  return { items: await withPartnerCounts(closedFirstLast), counts, total: closedFirstLast.length };
}

export async function withPartnerCounts<T extends { id: string }>(rows: T[]): Promise<(T & { partnerCount: number })[]> {
  if (!rows.length) return [];
  const g = await prisma.teamCall.groupBy({ by: ["opportunityId"], where: { opportunityId: { in: rows.map((r) => r.id) }, status: "open", hiddenAt: null, deadline: { gt: new Date() } }, _count: { _all: true } }).catch(() => []);
  const m = new Map(g.map((x) => [x.opportunityId, x._count._all]));
  return rows.map((r) => ({ ...r, partnerCount: m.get(r.id) ?? 0 }));
}

export async function closingThisWeek(limit = 6, now = new Date()) {
  let rows = await prisma.opportunity.findMany({ where: { type: "competition", isPublished: true, status: { notIn: ["archived", "completed"] }, deadline: { gt: now, lte: new Date(now.getTime() + 7 * 86_400_000) } }, select: COMPETITION_SELECT, orderBy: { deadline: "asc" }, take: limit });
  if (rows.length < 3) rows = await prisma.opportunity.findMany({ where: { type: "competition", isPublished: true, status: { notIn: ["archived", "completed"] }, deadline: { gt: now } }, select: COMPETITION_SELECT, orderBy: { deadline: "asc" }, take: limit });
  return withPartnerCounts(rows);
}

export const getCompetition = (slug: string) =>
  prisma.opportunity.findFirst({ where: { type: "competition", isPublished: true, OR: [{ slug }, { id: slug }] } });
