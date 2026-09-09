import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const { skip, take } = parsePagination(url);
  const type = url.searchParams.get("type")?.trim();
  const tag = url.searchParams.get("tag")?.trim();
  const eventId = url.searchParams.get("eventId")?.trim();
  const opportunityId = url.searchParams.get("opportunityId")?.trim();
  const search = url.searchParams.get("search")?.trim() || "";

  const where: Prisma.DocumentWhereInput = {
    ...(type ? { type: type as never } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(eventId ? { eventId } : {}),
    ...(opportunityId ? { opportunityId } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      skip,
      take,
      include: { event: { select: { id: true, title: true } }, opportunity: { select: { id: true, title: true } } },
    }),
    prisma.document.count({ where }),
  ]);
  return NextResponse.json({ documents, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const body = await request.json();
  if (!body.title || !body.url) {
    return NextResponse.json({ error: "Missing title or url" }, { status: 400 });
  }
  const newDocument = await prisma.document.create({
    data: {
      title: body.title,
      author: body.author || null,
      type: body.type || "report",
      url: body.url,
      description: body.description || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      opportunityId: body.opportunityId || null,
      eventId: body.eventId || null,
      userId: body.userId || user.id,
    },
  });
  return NextResponse.json(newDocument, { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.document.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.author !== undefined ? { author: data.author } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.url !== undefined ? { url: data.url } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.opportunityId !== undefined ? { opportunityId: data.opportunityId } : {}),
      ...(data.eventId !== undefined ? { eventId: data.eventId } : {}),
    },
  });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
});