// Candidate pool for match-making: platform profiles plus anyone listed in the sheet (rows added by hand included).
import "server-only";
import { prisma } from "@/lib/prisma";
import type { Candidate } from "@/lib/matchmaking";
import { readSheetCandidates, sheetConfigured } from "@/lib/matchmaking-sheet";

const TTL_MS = 5 * 60_000;
let cache: { at: number; rows: Candidate[] } | null = null;

export function hubCandidate(u: { email: string; name: string | null; preferredRole: string | null; pkmRole: string | null; interests: string[]; fields: string[]; major: string | null; faculty: string | null; institution: string; linkedinUrl: string | null; skills: string[] }): Candidate {
  return {
    key: u.email.toLowerCase(), name: u.name || u.email.split("@")[0]!, preferredRole: u.preferredRole, pkmRole: u.pkmRole,
    interests: u.interests, fields: u.fields, major: u.major ?? "", faculty: u.faculty ?? "", institution: u.institution,
    linkedinUrl: u.linkedinUrl, skills: u.skills, source: "hub",
  };
}

/** Sheet rows, cached for ~5 minutes. A sheet outage degrades to platform profiles only. */
async function sheetRows(): Promise<Candidate[]> {
  if (!sheetConfigured()) return [];
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  try {
    const rows = await readSheetCandidates();
    cache = { at: Date.now(), rows };
    return rows;
  } catch (e) {
    console.error("[matchmaking] sheet read failed:", (e as Error).message);
    return cache?.rows ?? [];
  }
}

export function invalidateSheetCache() { cache = null; }

export async function loadCandidates(): Promise<Candidate[]> {
  const [users, sheet] = await Promise.all([
    prisma.user.findMany({ where: { linkedinUrl: { not: null } }, select: { email: true, name: true, preferredRole: true, pkmRole: true, interests: true, fields: true, major: true, faculty: true, institution: true, linkedinUrl: true, skills: true } }),
    sheetRows(),
  ]);
  const hub = users.map(hubCandidate);
  const seen = new Set(hub.flatMap((c) => [c.key, c.linkedinUrl?.toLowerCase()].filter(Boolean) as string[]));
  return [...hub, ...sheet.filter((c) => !seen.has(c.key) && !(c.linkedinUrl && seen.has(c.linkedinUrl.toLowerCase())))];
}
