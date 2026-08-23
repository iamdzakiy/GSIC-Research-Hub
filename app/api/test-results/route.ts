import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

export const GET = withErrorHandler(async (request: Request) => {
  const { skip, take } = parsePagination(request.url);
  const [testResults, total] = await Promise.all([
    prisma.testResult.findMany({
      orderBy: { completedAt: "desc" },
      skip,
      take,
    }),
    prisma.testResult.count(),
  ]);
  return NextResponse.json({ testResults, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const body = await request.json();
  const newTestResult = await prisma.testResult.create({
    data: {
      ...body,
      userId: body.userId || user.id,
    },
  });
  return NextResponse.json(newTestResult, { status: 201 });
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.testResult.delete({ where: { id } });
  return NextResponse.json({ success: true });
});