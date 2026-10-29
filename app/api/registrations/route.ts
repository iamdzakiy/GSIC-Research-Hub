import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler, parsePagination, zodFieldErrors } from "@/lib/api-utils";
import { bootcampAnswers, registrationSchema, sandboxAnswers } from "@/lib/validation/events";
import { sendRegistrationEmail } from "@/lib/event-mail";
import { siteUrl } from "@/lib/supabaseAdmin";

export const GET = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const { skip, take } = parsePagination(request.url);
  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      orderBy: { registeredAt: "desc" },
      skip,
      take,
    }),
    prisma.registration.count(),
  ]);
  return NextResponse.json({ registrations, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

/** One-tap registration. The server decides status; the client only sends the event and its answers. */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Missing event.");
  const { eventId, answers } = parsed.data;

  const missing = [!user.name && "name", !user.faculty && "faculty", !user.major && "major", !user.linkedinUrl && "LinkedIn"].filter(Boolean);
  if (missing.length) throw new HttpError(403, `Complete your profile first (${missing.join(", ")}).`);

  const event = await prisma.event.findFirst({ where: { OR: [{ id: eventId }, { slug: eventId }] } });
  if (!event) throw new HttpError(404, "Event not found.");

  // Per-event answers, validated by event type.
  let details: Record<string, unknown>;
  if (event.type === "bootcamp") {
    const r = bootcampAnswers.safeParse(answers);
    if (!r.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(r.error));
    if (r.data.teamMembers.includes(user.email.toLowerCase())) throw new HttpError(422, "Do not list yourself.", { teamMembers: "Do not list yourself" });
    details = r.data;
  } else {
    const r = sandboxAnswers.safeParse(answers);
    if (!r.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(r.error));
    details = r.data;
  }

  const reg = await prisma.$transaction(async (tx) => {
    const now = new Date();
    if (!event.registrationOpen) throw new HttpError(409, "Registration is not open yet.");
    if (event.status === "completed" || event.status === "archived") throw new HttpError(409, "This event has ended.");
    if (now > event.registrationDeadline) throw new HttpError(409, "The registration deadline has passed.");
    if (await tx.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } } })) throw new HttpError(409, "You are already registered for this event.");
    // Atomic capacity check: the increment only succeeds while seats remain.
    const seat = await tx.event.updateMany({ where: { id: event.id, currentParticipants: { lt: event.maxParticipants } }, data: { currentParticipants: { increment: 1 } } });
    if (!seat.count) throw new HttpError(409, "This event is full.");
    return tx.registration.create({
      data: { userId: user.id, eventId: event.id, status: "confirmed", details: details as never, motivation: typeof details.hope === "string" ? details.hope : null },
    });
  });

  await sendRegistrationEmail(user, event, siteUrl(request));
  return NextResponse.json({ ok: true, id: reg.id }, { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.registration.update({
    where: { id },
    data: { ...data },
  });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.registration.delete({ where: { id } });
  return NextResponse.json({ success: true });
});