import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";

/** Who am I for this event? Registered users (and admins) also get the meeting link. Anonymous callers get registered:false. */
export const GET = withErrorHandler(async (request: Request, { params }: { params: { slug: string } }) => {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ ok: true, signedIn: false, registered: false, interested: false, meetingUrl: null });
  const event = await prisma.event.findFirst({ where: { OR: [{ slug: params.slug }, { id: params.slug }] }, select: { id: true, meetingUrl: true } });
  if (!event) return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
  const [reg, me, interest] = await Promise.all([
    prisma.registration.findUnique({ where: { userId_eventId: { userId: auth.id, eventId: event.id } }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: auth.id }, select: { role: true } }),
    prisma.eventInterest.findUnique({ where: { userId_eventId: { userId: auth.id, eventId: event.id } }, select: { userId: true } }),
  ]);
  const allowed = !!reg || me?.role === "admin";
  return NextResponse.json({ ok: true, signedIn: true, registered: !!reg, interested: !!interest, meetingUrl: allowed ? event.meetingUrl : null });
});
