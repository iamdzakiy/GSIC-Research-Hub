import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth-helper";
import { HttpError, withErrorHandler, parsePagination } from "@/lib/api-utils";
import { notifyEventOpened } from "@/lib/cron-tasks";

export const GET = withErrorHandler(async (request: Request) => {
  const { skip, take } = parsePagination(request.url);
  const auth = await getUserFromRequest(request);
  const isAdmin = !!auth && (await prisma.user.findUnique({ where: { id: auth.id }, select: { role: true } }))?.role === "admin";
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      orderBy: [{ comingSoon: "asc" }, { startDate: "asc" }],
      skip,
      take,
    }),
    prisma.event.count(),
  ]);
  // meetingUrl is for registered users (see /api/events/[slug]) and admins only.
  return NextResponse.json({ events: isAdmin ? events : events.map(({ meetingUrl: _m, ...e }) => e), total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const body = await request.json();
  const newEvent = await prisma.event.create({
    data: {
      ...body,
    },
  });
  return NextResponse.json(newEvent, { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const before = await prisma.event.findUnique({ where: { id }, select: { comingSoon: true } });
  if (!before) throw new HttpError(404, "Event not found");
  const next = { ...before, ...data } as Record<string, unknown>;
  if (next.comingSoon === false) {
    const merged = { ...(await prisma.event.findUnique({ where: { id } })), ...data } as Record<string, unknown>;
    const missing = ["startDate", "endDate", "registrationDeadline", "location", "maxParticipants"].filter((k) => !merged[k]);
    if (missing.length) throw new HttpError(422, `Set ${missing.join(", ")} before turning "coming soon" off.`);
  }
  const updated = await prisma.event.update({ where: { id }, data: { ...data } });
  // Opening a coming-soon program e-mails everyone who pressed "Notify me".
  if (before.comingSoon && updated.comingSoon === false && updated.registrationOpen) await notifyEventOpened(updated.id);
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
});