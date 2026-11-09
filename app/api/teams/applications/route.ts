import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { PERSON, closeExpired, personView } from "@/lib/team-calls";

export const runtime = "nodejs";

/** The signed-in user's own applications (owner WhatsApp only once accepted) and their own calls. */
export const GET = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  await closeExpired();
  const [applied, mine] = await Promise.all([
    prisma.teamApplication.findMany({ where: { applicantId: me.id }, include: { call: { include: { owner: { select: PERSON } } } }, orderBy: { createdAt: "desc" } }),
    prisma.teamCall.findMany({
      where: { ownerId: me.id }, orderBy: { createdAt: "desc" },
      include: { applications: { include: { applicant: { select: PERSON } }, orderBy: { createdAt: "asc" } } },
    }),
  ]);
  return NextResponse.json({
    ok: true,
    applications: await Promise.all(applied.map(async (a) => ({
      id: a.id, role: a.role, message: a.message, status: a.status, createdAt: a.createdAt,
      call: { id: a.call.id, title: a.call.title, competition: a.call.competition, status: a.call.status, deadline: a.call.deadline },
      owner: await personView(a.call.owner, { reveal: a.status === "accepted", withCv: true }),
    }))),
    calls: await Promise.all(mine.map(async (c) => ({
      id: c.id, title: c.title, competition: c.competition, rolesNeeded: c.rolesNeeded, slots: c.slots, status: c.status, deadline: c.deadline, description: c.description,
      applications: await Promise.all(c.applications.map(async (a) => ({
        id: a.id, role: a.role, message: a.message, status: a.status, createdAt: a.createdAt,
        applicant: await personView(a.applicant, { reveal: a.status === "accepted", withCv: true }),
      }))),
    }))),
  });
});
