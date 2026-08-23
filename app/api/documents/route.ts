import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

export const GET = withErrorHandler(async (request: Request) => {
  const { skip, take } = parsePagination(request.url);
  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      orderBy: { uploadedAt: "desc" },
      skip,
      take,
    }),
    prisma.document.count(),
  ]);
  return NextResponse.json({ documents, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const body = await request.json();
  const newDocument = await prisma.document.create({
    data: {
      ...body,
      userId: body.userId || user.id,
    },
  });
  return NextResponse.json(newDocument, { status: 201 });
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
});