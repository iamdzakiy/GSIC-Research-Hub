import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { linkInput } from "@/lib/validation/opportunity";
import { fieldErrors } from "@/lib/validation/auth";

/** Public: published links. Admin (?all=1 + auth): everything. */
export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.trim();
  const q = url.searchParams.get("q")?.trim();
  if (url.searchParams.get("all") === "1") await requireAdmin(request);
  const where: Prisma.ResourceLinkWhereInput = {
    ...(url.searchParams.get("all") === "1" ? {} : { status: "published" }),
    ...(category ? { category } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { url: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const links = await prisma.resourceLink.findMany({ where, orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { title: "asc" }] });
  return NextResponse.json({ links });
});

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const parsed = linkInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data", fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
  const exists = await prisma.resourceLink.findUnique({ where: { url: parsed.data.url } });
  if (exists) return NextResponse.json({ error: "This URL is already in the link collection." }, { status: 409 });
  const link = await prisma.resourceLink.create({ data: { ...parsed.data, description: parsed.data.description ?? null, tags: parsed.data.tags ?? [] } });
  return NextResponse.json(link, { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id, ...rest } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const parsed = linkInput.partial().safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data", fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
  const link = await prisma.resourceLink.update({ where: { id }, data: parsed.data });
  return NextResponse.json(link);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.resourceLink.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
