import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

export const GET = withErrorHandler(async (request: Request) => {
  const { skip, take } = parsePagination(request.url);
  const [speakers, total] = await Promise.all([
    prisma.speaker.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.speaker.count(),
  ]);
  return NextResponse.json({ speakers, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const body = await request.json();
  if (!body.name || !body.roleTitle || !body.institution || !body.avatarUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const speaker = await prisma.speaker.create({
    data: {
      name: body.name,
      roleTitle: body.roleTitle,
      institution: body.institution,
      avatarUrl: body.avatarUrl,
      bio: body.bio || null,
      linkedinUrl: body.linkedinUrl || null,
      order: body.order || 0,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json(speaker, { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const updated = await prisma.speaker.update({ where: { id }, data });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.speaker.delete({ where: { id } });
  return NextResponse.json({ success: true });
});