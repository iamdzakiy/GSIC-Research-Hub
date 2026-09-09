import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const eventId = url.searchParams.get("eventId");
  const { skip, take } = parsePagination(url);

  if (id) {
    const test = await prisma.test.findUnique({ where: { id } });
    return NextResponse.json(test ?? { error: "Not found" }, { status: test ? 200 : 404 });
  }

  const where = eventId ? { eventId } : {};
  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
    }),
    prisma.test.count({ where }),
  ]);
  return NextResponse.json({ tests, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const body = await request.json();
  if (!body.eventId || !body.title || !body.questions) {
    return NextResponse.json({ error: "Missing eventId, title or questions" }, { status: 400 });
  }
  const newTest = await prisma.test.create({
    data: {
      eventId: body.eventId,
      type: body.type || "pre",
      title: body.title,
      description: body.description || null,
      questions: body.questions,
      durationMinutes: Number(body.durationMinutes) || 15,
      passingScore: Number(body.passingScore) || 0,
    },
  });
  return NextResponse.json(newTest, { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.test.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.eventId !== undefined ? { eventId: data.eventId } : {}),
      ...(data.questions !== undefined ? { questions: data.questions } : {}),
      ...(data.durationMinutes !== undefined ? { durationMinutes: Number(data.durationMinutes) } : {}),
      ...(data.passingScore !== undefined ? { passingScore: Number(data.passingScore) } : {}),
    },
  });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.test.delete({ where: { id } });
  return NextResponse.json({ success: true });
});