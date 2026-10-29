import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler, zodFieldErrors } from "@/lib/api-utils";
import { createCallSchema } from "@/lib/validation/teams";
import { scoreMatch } from "@/lib/matchmaking";
import { hubCandidate } from "@/lib/matchmaking-data";
import { MAX_OPEN_CALLS, PERSON, closeExpired, personView } from "@/lib/team-calls";

export const runtime = "nodejs";

/**
 * GET /api/teams/calls?competition=&scheme=&role=&opportunity=<slug>&event=<slug>
 * Open calls by other people. Calls that fit the viewer come first (scoreMatch + role/scheme fit).
 */
export const GET = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  await closeExpired();
  const q = new URL(request.url).searchParams;
  const competition = q.get("competition")?.trim();
  const scheme = q.get("scheme")?.trim();
  const role = q.get("role")?.trim();
  const [opp, ev] = await Promise.all([
    q.get("opportunity") ? prisma.opportunity.findUnique({ where: { slug: q.get("opportunity")! }, select: { id: true } }) : null,
    q.get("event") ? prisma.event.findFirst({ where: { OR: [{ id: q.get("event")! }, { slug: q.get("event")! }] }, select: { id: true } }) : null,
  ]);

  const calls = await prisma.teamCall.findMany({
    where: {
      status: "open", deadline: { gt: new Date() }, ownerId: { not: me.id },
      ...(competition ? { competition: { contains: competition, mode: "insensitive" } } : {}),
      ...(scheme ? { interests: { has: scheme } } : {}),
      ...(role ? { rolesNeeded: { has: role } } : {}),
      ...(q.get("opportunity") ? { opportunityId: opp?.id ?? "none" } : {}),
      ...(q.get("event") ? { eventId: ev?.id ?? "none" } : {}),
    },
    include: { owner: { select: { ...PERSON, email: true, interests: true, fields: true, pkmRole: true, skills: true } }, applications: { where: { applicantId: me.id }, select: { id: true, status: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const meCand = hubCandidate(me);
  const items = await Promise.all(calls.map(async (c) => {
    const fit = scoreMatch(meCand, hubCandidate(c.owner));
    const needsMe = !!me.preferredRole && c.rolesNeeded.includes(me.preferredRole);
    const sharedSchemes = c.interests.filter((i) => me.interests.includes(i)).length;
    const relevance = fit.score + (needsMe ? 25 : 0) + sharedSchemes * 10;
    const reason = [needsMe ? "Needs your role" : "", sharedSchemes ? `${sharedSchemes} shared scheme${sharedSchemes > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ") || fit.reason;
    return {
      id: c.id, title: c.title, competition: c.competition, opportunityId: c.opportunityId, eventId: c.eventId, interests: c.interests,
      rolesNeeded: c.rolesNeeded, slots: c.slots, description: c.description, deadline: c.deadline, status: c.status, createdAt: c.createdAt,
      owner: await personView(c.owner, { reveal: false, withCv: false }),
      myApplication: c.applications[0] ?? null, relevance, reason,
    };
  }));
  items.sort((a, b) => b.relevance - a.relevance || +new Date(b.createdAt) - +new Date(a.createdAt));
  return NextResponse.json({ ok: true, calls: items });
});

export const POST = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  if (!me.linkedinUrl) throw new HttpError(403, "Add your LinkedIn profile before posting a call.");
  const parsed = createCallSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(parsed.error));
  const d = parsed.data;

  await closeExpired();
  const open = await prisma.teamCall.count({ where: { ownerId: me.id, status: "open" } });
  if (open >= MAX_OPEN_CALLS) throw new HttpError(409, `You can have at most ${MAX_OPEN_CALLS} open calls. Close one first.`);
  if (d.opportunityId && !(await prisma.opportunity.findUnique({ where: { id: d.opportunityId }, select: { id: true } }))) throw new HttpError(422, "That competition no longer exists.", { competition: "Pick a different competition" });
  if (d.eventId && !(await prisma.event.findUnique({ where: { id: d.eventId }, select: { id: true } }))) throw new HttpError(422, "That event no longer exists.", { competition: "Pick a different event" });

  const call = await prisma.teamCall.create({
    data: { ownerId: me.id, title: d.title, competition: d.competition, opportunityId: d.opportunityId || null, eventId: d.eventId || null, interests: d.interests, rolesNeeded: d.rolesNeeded, slots: d.slots, description: d.description, deadline: d.deadline },
  });
  return NextResponse.json({ ok: true, id: call.id }, { status: 201 });
});
