import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

export const GET = withErrorHandler(async (request: Request) => {
  const { skip, take } = parsePagination(request.url);
  const auth = await getUserFromRequest(request);
  const isAdmin = !!auth && (await prisma.user.findUnique({ where: { id: auth.id }, select: { role: true } }))?.role === "admin";
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startDate: "asc" },
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

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...data,
    },
  });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
});