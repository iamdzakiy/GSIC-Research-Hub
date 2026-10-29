import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
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
  if (!c) throw new HttpError(404, "Call not found");
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

/** Owner closes (or re-opens, if still in time and slots remain) their call. */
export const PATCH = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const me = await requireUser(request);
  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  if (body?.status !== "closed") throw new HttpError(422, "Only closing a call is supported.");
  const r = await prisma.teamCall.updateMany({ where: { id: params.id, ownerId: me.id, status: "open" }, data: { status: "closed" } });
  if (!r.count) throw new HttpError(404, "Call not found or already closed.");
  return NextResponse.json({ ok: true });
});
