import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

export const GET = withErrorHandler(async (request: Request) => {
  const { skip, take } = parsePagination(request.url);
  const [curated, total] = await Promise.all([
    prisma.curatedOpportunity.findMany({
      orderBy: { id: "asc" },
      skip,
      take,
    }),
    prisma.curatedOpportunity.count(),
  ]);
  return NextResponse.json({ curated, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const body = await request.json();
  if (!body.title || !body.type || !body.organizer || !body.monthOpen) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const newCurated = await prisma.curatedOpportunity.create({
    data: {
      title: body.title,
      type: body.type,
      organizer: body.organizer,
      monthOpen: body.monthOpen,
      description: body.description || "",
      link: body.link || "",
    },
  });
  return NextResponse.json(newCurated, { status: 201 });
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.curatedOpportunity.delete({ where: { id } });
  return NextResponse.json({ success: true });
});