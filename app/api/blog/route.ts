import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";
import { slugify, uniqueSlug } from "@/lib/slugify";

const AUTH_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  email: true,
};

export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const { skip, take } = parsePagination(url);
  const search = url.searchParams.get("search")?.trim() || "";
  const tag = url.searchParams.get("tag")?.trim() || "";
  const statusParam = url.searchParams.get("status")?.trim() || "";

  // Public requests only ever see published posts unless an admin explicitly
  // asks for drafts via the dashboard.
  const wantsDrafts = statusParam === "draft";
  if (wantsDrafts) await requireAdmin(request); // drafts are never public
  const canSeeDrafts = wantsDrafts || statusParam === "published";
  const where: any = {
    ...(canSeeDrafts
      ? { status: statusParam as "draft" | "published" }
      : { status: "published" }),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { content: { contains: search, mode: "insensitive" as const } },
            { excerpt: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(tag ? { tags: { has: tag } } : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take,
      include: { author: { select: AUTH_SELECT } },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  const admin = await requireAdmin(request);
  const body = await request.json();

  if (!body.title || !body.content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const status: "draft" | "published" = body.status === "published" ? "published" : "draft";
  const slug = await uniqueSlug(body.slug || body.title, async (candidate) => {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate } });
    return !!existing;
  });

  const post = await prisma.blogPost.create({
    data: {
      title: body.title,
      slug,
      content: body.content,
      excerpt: body.excerpt || null,
      coverImage: body.coverImage || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      status,
      authorId: admin.id,
      publishedAt: status === "published" ? new Date() : null,
    },
    include: { author: { select: AUTH_SELECT } },
  });

  return NextResponse.json(post, { status: 201 });
});