import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler, parsePagination, zodFieldErrors } from "@/lib/api-utils";
import { bootcampAnswers, registrationSchema, sandboxAnswers } from "@/lib/validation/events";
import { sendRegistrationEmail } from "@/lib/event-mail";
import { siteUrl } from "@/lib/supabaseAdmin";
import { assertTeamFree, notifyPromoted, promoteNext, resolveTeam, type StoredMember } from "@/lib/registration";

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

  if (!user.nim) throw new HttpError(403, "Add your NIM to your profile first.", { nim: "Add your NIM first" });

  const event = await prisma.event.findFirst({ where: { OR: [{ id: eventId }, { slug: eventId }] } });
  if (!event) throw new HttpError(404, "Event not found.");

  // Per-event answers, validated by event type.
  let details: Record<string, unknown>;
  if (event.type === "bootcamp") {
    const r = bootcampAnswers.safeParse(answers);
    if (!r.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(r.error));
    const team = await resolveTeam(user, r.data.needsTeam ? [] : r.data.teamMembers);
    details = { ...r.data, teamMembers: team };
  } else {
    const r = sandboxAnswers.safeParse(answers);
    if (!r.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(r.error));
    details = r.data;
  }

  if (event.comingSoon) throw new HttpError(409, "This program is coming soon. Use \"Notify me\" to hear when registration opens.");
  if (!event.registrationDeadline || !event.maxParticipants || !event.startDate || !event.endDate) throw new HttpError(409, "Registration is not open yet.");
  const deadline = event.registrationDeadline, cap = event.maxParticipants;
  const reg = await prisma.$transaction(async (tx) => {
    const now = new Date();
    if (!event.registrationOpen) throw new HttpError(409, "Registration is not open yet.");
    if (event.status === "completed" || event.status === "archived") throw new HttpError(409, "This event has ended.");
    if (now > deadline) throw new HttpError(409, "The registration deadline has passed.");
    const existing = await tx.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } } });
    if (existing && existing.status !== "cancelled") throw new HttpError(409, "You are already registered for this event.");
    if (event.type === "bootcamp") await assertTeamFree(tx, event.id, user, (details.teamMembers as StoredMember[]) ?? []);
    // Atomic capacity check: the increment only succeeds while seats remain. A full event takes a waitlist place instead.
    const seat = await tx.event.updateMany({ where: { id: event.id, currentParticipants: { lt: cap } }, data: { currentParticipants: { increment: 1 } } });
    const status = seat.count ? "confirmed" : "waitlisted";
    const data = { status, details: details as never, motivation: typeof details.hope === "string" ? details.hope : null, registeredAt: new Date() } as const;
    return existing
      ? tx.registration.update({ where: { id: existing.id }, data })
      : tx.registration.create({ data: { userId: user.id, eventId: event.id, ...data } });
  });

  await prisma.formDraft.deleteMany({ where: { userId: user.id, formKey: `event:${event.slug}` } });
  if (reg.status === "confirmed") await sendRegistrationEmail(user, { ...event, startDate: event.startDate, endDate: event.endDate, location: event.location ?? "" }, siteUrl(request));
  return NextResponse.json({ ok: true, id: reg.id, status: reg.status }, { status: 201 });
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
  const promoted = await prisma.$transaction(async (tx) => {
    const r = await tx.registration.findUnique({ where: { id }, include: { event: { select: { id: true, title: true, slug: true } } } });
    if (!r) return null;
    await tx.registration.delete({ where: { id } });
    if (r.status !== "confirmed") return null;
    await tx.event.updateMany({ where: { id: r.eventId, currentParticipants: { gt: 0 } }, data: { currentParticipants: { decrement: 1 } } });
    const p = await promoteNext(tx, r.eventId);
    return p ? { p, event: r.event } : null;
  });
  if (promoted) await notifyPromoted(promoted.p, promoted.event);
  return NextResponse.json({ success: true });
});