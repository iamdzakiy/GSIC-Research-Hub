import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { rank } from "@/lib/matchmaking";
import { hubCandidate, loadCandidates } from "@/lib/matchmaking-data";

export const runtime = "nodejs";

/** Top complementary teammates for the signed-in user. Contact details are never included. */
export const GET = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const me = hubCandidate(user);
  const matches = rank(me, await loadCandidates(), 20).map((m) => ({
    name: m.candidate.name, preferredRole: m.candidate.preferredRole, pkmRole: m.candidate.pkmRole, interests: m.candidate.interests,
    major: m.candidate.major, faculty: m.candidate.faculty, institution: m.candidate.institution, linkedinUrl: m.candidate.linkedinUrl,
    score: m.score, reason: m.reason,
  }));
  return NextResponse.json({ ok: true, matches });
});
