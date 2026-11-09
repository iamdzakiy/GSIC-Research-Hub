import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";

type Ctx = { params: { slug: string } };
const find = (slug: string) => prisma.event.findFirst({ where: { OR: [{ slug }, { id: slug }] }, select: { id: true, comingSoon: true } });

/** "Notify me": we e-mail this user once registration opens. */
export const POST = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const me = await requireUser(request);
  const ev = await find(params.slug);
  if (!ev) throw new HttpError(404, "Event not found");
  await prisma.eventInterest.upsert({ where: { userId_eventId: { userId: me.id, eventId: ev.id } }, update: { notifiedAt: null }, create: { userId: me.id, eventId: ev.id } });
  return NextResponse.json({ ok: true, interested: true });
});

export const DELETE = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const me = await requireUser(request);
  const ev = await find(params.slug);
  if (!ev) throw new HttpError(404, "Event not found");
  await prisma.eventInterest.deleteMany({ where: { userId: me.id, eventId: ev.id } });
  return NextResponse.json({ ok: true, interested: false });
});
