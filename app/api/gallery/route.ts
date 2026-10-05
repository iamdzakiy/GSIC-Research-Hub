import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";

const httpUrl = z.string().trim().url().max(2000).refine((u) => /^https?:\/\//i.test(u), "Harus http(s)");
const input = z.object({
  title: z.string().trim().min(2).max(120),
  caption: z.string().trim().max(400).nullish(),
  imageUrl: httpUrl,
  eventLabel: z.string().trim().max(80).nullish(),
  takenAt: z.string().datetime().nullish(),
  order: z.coerce.number().int().min(0).max(9999).default(0),
  isPublished: z.boolean().default(true),
});

export const GET = withErrorHandler(async (request: Request) => {
  const all = new URL(request.url).searchParams.get("all") === "1";
  if (all) await requireAdmin(request);
  const items = await prisma.galleryItem.findMany({ where: all ? {} : { isPublished: true }, orderBy: [{ order: "asc" }, { createdAt: "desc" }], take: 200 });
  return NextResponse.json({ items });
});

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const p = input.safeParse(await request.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const { takenAt, ...rest } = p.data;
  return NextResponse.json(await prisma.galleryItem.create({ data: { ...rest, takenAt: takenAt ? new Date(takenAt) : null } }), { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id, ...rest } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const p = input.partial().safeParse(rest);
  if (!p.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const { takenAt, ...d } = p.data;
  return NextResponse.json(await prisma.galleryItem.update({ where: { id }, data: { ...d, ...(takenAt !== undefined ? { takenAt: takenAt ? new Date(takenAt) : null } : {}) } }));
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.galleryItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
