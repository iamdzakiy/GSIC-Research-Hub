import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 80);
}

export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const { skip, take } = parsePagination(url);

  if (slug) {
    const opp = await prisma.opportunity.findUnique({ where: { slug } });
    return NextResponse.json(opp ? [opp] : []);
  }

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      orderBy: { deadline: "asc" },
      skip,
      take,
    }),
    prisma.opportunity.count(),
  ]);
  return NextResponse.json({ opportunities, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const body = await request.json();
  if (!body.title || !body.type || !body.organizer || !body.deadline) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const baseSlug = body.slug || slugify(body.title);
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.opportunity.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const newOpp = await prisma.opportunity.create({
    data: {
      ...body,
      slug,
      deadline: new Date(body.deadline),
    },
  });
  return NextResponse.json(newOpp, { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.opportunity.update({
    where: { id },
    data: {
      ...data,
      slug: data.slug || (data.title ? slugify(data.title) : undefined),
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    },
  });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.opportunity.delete({ where: { id } });
  return NextResponse.json({ success: true });
});