import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";

/** Who am I for this event? Registered users (and admins) also get the meeting link. Anonymous callers get registered:false. */
export const GET = withErrorHandler(async (request: Request, { params }: { params: { slug: string } }) => {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ ok: true, signedIn: false, registered: false, interested: false, meetingUrl: null });
  const event = await prisma.event.findFirst({ where: { OR: [{ slug: params.slug }, { id: params.slug }] }, select: { id: true, meetingUrl: true, registrationDeadline: true, status: true } });
  if (!event) return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
  const [reg, me, interest] = await Promise.all([
    prisma.registration.findUnique({ where: { userId_eventId: { userId: auth.id, eventId: event.id } }, select: { id: true, status: true, details: true, registeredAt: true } }),
    prisma.user.findUnique({ where: { id: auth.id }, select: { role: true } }),
    prisma.eventInterest.findUnique({ where: { userId_eventId: { userId: auth.id, eventId: event.id } }, select: { userId: true } }),
  ]);
  const active = reg && reg.status !== "cancelled" ? reg : null;
  const waitlisted = active?.status === "waitlisted";
  const allowed = (!!active && !waitlisted) || me?.role === "admin";
  const position = waitlisted ? 1 + (await prisma.registration.count({ where: { eventId: event.id, status: "waitlisted", registeredAt: { lt: active.registeredAt } } })) : null;
  const canEdit = !!active && !!event.registrationDeadline && new Date() <= event.registrationDeadline && event.status !== "completed" && event.status !== "archived";
  return NextResponse.json({
    ok: true, signedIn: true, registered: !!active && !waitlisted, waitlisted, position, interested: !!interest, meetingUrl: allowed ? event.meetingUrl : null,
    registration: active ? { id: active.id, status: active.status, details: active.details, canEdit } : null,
  });
});
