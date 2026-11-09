import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { callActionSchema } from "@/lib/validation/teams";
import { PERSON, closeExpired, personView } from "@/lib/team-calls";

export const runtime = "nodejs";
type Ctx = { params: { id: string } };

/** Call detail. The owner also gets applicants (WhatsApp only for accepted ones). */
export const GET = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const me = await requireUser(request);
  await closeExpired();
  const c = await prisma.teamCall.findUnique({
    where: { id: params.id },
    include: { owner: { select: PERSON }, applications: { include: { applicant: { select: PERSON } }, orderBy: { createdAt: "asc" } } },
  });
  if (!c || (c.hiddenAt && c.ownerId !== me.id && me.role !== "admin")) throw new HttpError(404, "Call not found");
  const isOwner = c.ownerId === me.id;
  const mine = c.applications.find((a) => a.applicantId === me.id);
  const { owner, applications, ...call } = c;
  return NextResponse.json({
    ok: true,
    call: {
      ...call, isOwner,
      owner: await personView(owner, { reveal: mine?.status === "accepted", withCv: true }),
      myApplication: mine ? { id: mine.id, role: mine.role, message: mine.message, status: mine.status } : null,
      applications: isOwner
        ? await Promise.all(applications.map(async (a) => ({
            id: a.id, role: a.role, message: a.message, status: a.status, createdAt: a.createdAt,
            applicant: await personView(a.applicant, { reveal: a.status === "accepted", withCv: true }),
          })))
        : undefined,
    },
  });
});

/** Owner actions: close, mark filled, or extend by N days (never past the competition's registration close). */
export const PATCH = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const me = await requireUser(request);
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = callActionSchema.safeParse(raw?.status === "closed" ? { action: "close" } : raw);
  if (!parsed.success) throw new HttpError(422, "Unknown action.");
  const c = await prisma.teamCall.findFirst({ where: { id: params.id, ownerId: me.id }, include: { opportunity: { select: { deadline: true } } } });
  if (!c) throw new HttpError(404, "Call not found.");
  const { action, days = 14 } = parsed.data;
  if (action === "extend") {
    let until = new Date(Math.max(c.deadline.getTime(), Date.now()) + days * 86_400_000);
    const cap = c.opportunity?.deadline;
    if (cap && until > cap) until = cap;
    if (until.getTime() <= Date.now()) throw new HttpError(409, "Registration for this competition has closed.");
    await prisma.teamCall.update({ where: { id: c.id }, data: { deadline: until, status: c.slots > 0 ? "open" : c.status } });
    return NextResponse.json({ ok: true, deadline: until });
  }
  await prisma.teamCall.update({ where: { id: c.id }, data: { status: action === "filled" ? "filled" : "closed" } });
  return NextResponse.json({ ok: true });
});
