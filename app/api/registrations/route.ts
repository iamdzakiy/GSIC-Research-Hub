import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

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

export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);

  const body = await request.json();
  if (!body.eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const newRegistration = await prisma.registration.create({
    data: {
      userId: user.id,
      eventId: body.eventId,
      status: body.status || "confirmed",
      preTestCompleted: body.preTestCompleted || false,
      postTestCompleted: body.postTestCompleted || false,
    },
  });
  return NextResponse.json(newRegistration, { status: 201 });
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