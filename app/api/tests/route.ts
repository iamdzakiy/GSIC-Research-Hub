import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

export const GET = withErrorHandler(async (request: Request) => {
  const { skip, take } = parsePagination(request.url);
  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      orderBy: { id: "desc" },
      skip,
      take,
    }),
    prisma.test.count(),
  ]);
  return NextResponse.json({ tests, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const body = await request.json();
  const newTest = await prisma.test.create({
    data: {
      ...body,
    },
  });
  return NextResponse.json(newTest, { status: 201 });
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.test.delete({ where: { id } });
  return NextResponse.json({ success: true });
});