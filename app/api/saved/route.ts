import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";

const body = z.object({ opportunityId: z.string().trim().min(1).max(40) });

/** The signed-in user's saved opportunities, soonest deadline first. */
export const GET = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const rows = await prisma.savedOpportunity.findMany({
    where: { userId: user.id },
    include: { opportunity: { select: { id: true, slug: true, title: true, organizer: true, deadline: true } } },
  });
  rows.sort((a, b) => +a.opportunity.deadline - +b.opportunity.deadline);
  return NextResponse.json({ ok: true, saved: rows.map((r) => r.opportunity) });
});

export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Missing opportunity.");
  const exists = await prisma.opportunity.findUnique({ where: { id: parsed.data.opportunityId }, select: { id: true } });
  if (!exists) throw new HttpError(404, "Opportunity not found.");
  await prisma.savedOpportunity.upsert({
    where: { userId_opportunityId: { userId: user.id, opportunityId: exists.id } },
    update: {}, create: { userId: user.id, opportunityId: exists.id },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Missing opportunity.");
  await prisma.savedOpportunity.deleteMany({ where: { userId: user.id, opportunityId: parsed.data.opportunityId } });
  return NextResponse.json({ ok: true });
});
