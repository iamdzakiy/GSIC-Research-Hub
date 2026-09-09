import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { slugify, uniqueSlug } from "@/lib/slugify";

const AUTH_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  email: true,
};

type Ctx = { params: { slug: string } };

export const GET = withErrorHandler(async (_request: Request, ctx: Ctx) => {
  const { slug } = ctx.params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "published" },
    include: { author: { select: AUTH_SELECT } },
  });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(post);
});

export const PUT = withErrorHandler(async (request: Request, ctx: Ctx) => {
  await requireAdmin(request);
  const { slug } = ctx.params;
  const body = await request.json();

  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status: "draft" | "published" =
    body.status === "published" ? "published" : body.status === "draft" ? "draft" : existing.status;
  const wantsPublished = status === "published";

  const nextSlug =
    typeof body.slug === "string" && body.slug.trim()
      ? await uniqueSlug(body.slug, async (candidate) => {
          const collision = await prisma.blogPost.findUnique({ where: { slug: candidate } });
          return !!collision && collision.id !== existing.id;
        })
      : existing.slug;

  const post = await prisma.blogPost.update({
    where: { slug },
    data: {
      title: typeof body.title === "string" ? body.title : existing.title,
      slug: nextSlug,
      content: typeof body.content === "string" ? body.content : existing.content,
      excerpt: body.excerpt !== undefined ? body.excerpt : existing.excerpt,
      coverImage: body.coverImage !== undefined ? body.coverImage : existing.coverImage,
      tags: Array.isArray(body.tags) ? body.tags : existing.tags,
      status,
      // Auto-publish when transitioning from draft -> published.
      publishedAt:
        wantsPublished && !existing.publishedAt
          ? new Date()
          : existing.publishedAt,
    },
    include: { author: { select: AUTH_SELECT } },
  });

  return NextResponse.json(post);
});

export const DELETE = withErrorHandler(async (request: Request, ctx: Ctx) => {
  await requireAdmin(request);
  const { slug } = ctx.params;
  // Allow deletion by slug or by id (dashboard passes id).
  const byId = await prisma.blogPost.findUnique({ where: { id: slug } }).catch(() => null);
  const where = byId ? { id: byId.id } : { slug };
  await prisma.blogPost.delete({ where });
  return NextResponse.json({ success: true });
});