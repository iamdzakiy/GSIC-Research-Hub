// Pure matching logic, shared by the match-making API and the team-call ranking.
import { INTERESTS, PKM_SCHEMES, PREFERRED_ROLES, labelOf } from "@/lib/profile-options";

export interface Candidate {
  /** Stable key: lowercase email when known, else LinkedIn URL, else sheet row. */
  key: string;
  name: string;
  preferredRole: string | null;
  pkmRole: string | null;
  interests: string[];
  fields: string[];
  major: string;
  /** Faculty code without the sheet's suffix (SITH-S becomes SITH). */
  faculty: string;
  institution: string;
  linkedinUrl: string | null;
  skills: string[];
  source: "hub" | "sheet";
}

export interface Scored { candidate: Candidate; score: number; reason: string }

const PKM_IDS: string[] = PKM_SCHEMES.map((s) => s.id);
const label = (id: string) => labelOf(INTERESTS, id);

/**
 * Scores how useful `cand` is as a teammate for `me` (higher is better, 0 means no signal).
 * The goal is complementary teams, so a different role weighs as much as shared interests:
 *   shared PKM schemes        15 each, max 45   (high)
 *   different preferred role  30                (high)
 *   different faculty         10                (medium)
 *   no overlapping field      10                (medium)
 *   other shared interests    5 each, max 10    (low)
 *   hard skills you lack      2 each, max 10    (low)
 */
export function scoreMatch(me: Candidate, cand: Candidate): { score: number; reason: string } {
  let score = 0;
  const parts: string[] = [];

  if (me.preferredRole && cand.preferredRole && me.preferredRole !== cand.preferredRole) {
    score += 30;
    parts.push(`Different role: ${labelOf(PREFERRED_ROLES, cand.preferredRole)}`);
  }
  const shared = cand.interests.filter((i) => me.interests.includes(i));
  const sharedPkm = shared.filter((i) => PKM_IDS.includes(i));
  const sharedOther = shared.filter((i) => !PKM_IDS.includes(i));
  score += Math.min(sharedPkm.length * 15, 45) + Math.min(sharedOther.length * 5, 10);
  if (shared.length) parts.push(`Shared: ${shared.map(label).join(", ")}`);

  if (me.faculty && cand.faculty && me.faculty !== cand.faculty) {
    score += 10;
    parts.push(`Different faculty: ${cand.faculty}`);
  }
  if (me.fields.length && cand.fields.length && !cand.fields.some((f) => me.fields.includes(f))) score += 10;

  const extra = cand.skills.filter((s) => !me.skills.includes(s));
  if (extra.length) {
    score += Math.min(extra.length * 2, 10);
    parts.push(`Skills you lack: ${extra.slice(0, 2).join(", ")}`);
  }
  return { score, reason: parts.join(" · ") };
}

export function rank(me: Candidate, candidates: Candidate[], limit = 20): Scored[] {
  return candidates
    .filter((c) => c.key !== me.key)
    .map((c) => ({ candidate: c, ...scoreMatch(me, c) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
