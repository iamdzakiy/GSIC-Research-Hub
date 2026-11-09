// Public read side of Seeking Partner. No contact details here: WhatsApp is only revealed by the
// authenticated API after an accept.
import "server-only";
import { prisma } from "@/lib/prisma";
import { isCategory } from "@/lib/competitions";
import type { Prisma } from "../generated/prisma/client";

export const OWNER_PUBLIC = { id: true, name: true, avatarUrl: true, major: true, faculty: true, headline: true, username: true, directoryVisible: true } as const;

export const PARTNER_SELECT = {
  id: true, kind: true, title: true, competition: true, category: true, rolesNeeded: true, skillsNeeded: true, commitment: true,
  currentTeamSize: true, slots: true, deadline: true, description: true, status: true, createdAt: true, ownerId: true,
  owner: { select: OWNER_PUBLIC },
  opportunity: { select: { slug: true, title: true, deadline: true, category: true, guidebookUrl: true } },
  event: { select: { slug: true, title: true } },
  _count: { select: { applications: true } },
} as const;

export type PartnerPost = Prisma.TeamCallGetPayload<{ select: typeof PARTNER_SELECT }>;

export interface PartnerFilters { kind?: "team_needs_member" | "looking_for_team"; cat?: string; q?: string; competition?: string; event?: string }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
export function parsePartnerFilters(raw: Record<string, string | string[] | undefined>): PartnerFilters {
  const kind = one(raw.kind);
  const cat = one(raw.cat);
  return {
    kind: kind === "team_needs_member" || kind === "looking_for_team" ? kind : undefined,
    cat: cat && isCategory(cat) ? cat : undefined,
    q: one(raw.q)?.slice(0, 80),
    competition: one(raw.competition)?.slice(0, 120),
    event: one(raw.event)?.slice(0, 120),
  };
}

export const liveWhere = (now = new Date()): Prisma.TeamCallWhereInput => ({ status: "open", deadline: { gt: now }, hiddenAt: null, owner: { deletedAt: null } });

export async function listPartnerPosts(f: PartnerFilters, take = 60) {
  const where: Prisma.TeamCallWhereInput = {
    ...liveWhere(),
    ...(f.kind ? { kind: f.kind } : {}),
    ...(f.cat ? { category: f.cat } : {}),
    ...(f.competition ? { OR: [{ opportunity: { slug: f.competition } }, { opportunityId: f.competition }] } : {}),
    ...(f.event ? { event: { slug: f.event } } : {}),
    ...(f.q ? { AND: [{ OR: [
      { title: { contains: f.q, mode: "insensitive" } }, { competition: { contains: f.q, mode: "insensitive" } },
      { description: { contains: f.q, mode: "insensitive" } }, { rolesNeeded: { has: f.q } }, { skillsNeeded: { has: f.q } },
    ] }] } : {}),
  };
  const [items, total, byKind] = await Promise.all([
    prisma.teamCall.findMany({ where, select: PARTNER_SELECT, orderBy: { createdAt: "desc" }, take }),
    prisma.teamCall.count({ where }),
    prisma.teamCall.groupBy({ by: ["kind"], where: liveWhere(), _count: true }),
  ]);
  return { items, total, kinds: Object.fromEntries(byKind.map((k) => [k.kind, k._count])) as Record<string, number> };
}

export const latestPartnerPosts = (take = 6) =>
  prisma.teamCall.findMany({ where: liveWhere(), select: PARTNER_SELECT, orderBy: { createdAt: "desc" }, take });

export const postsForCompetition = (opportunityId: string, take = 6) =>
  prisma.teamCall.findMany({ where: { ...liveWhere(), opportunityId }, select: PARTNER_SELECT, orderBy: { createdAt: "desc" }, take });

export const getPartnerPost = (id: string) =>
  prisma.teamCall.findFirst({ where: { id, hiddenAt: null }, select: PARTNER_SELECT });
