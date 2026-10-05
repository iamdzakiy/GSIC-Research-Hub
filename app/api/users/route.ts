import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";
import { mapPrismaUserToProfile } from "@/services/userService";
import { profileUpdateSchema, profileToData } from "@/lib/validation/profile";

/**
 * Create the signed-in user's own profile row (first sign-in).
 * The id always comes from the verified token (never the body) and the role is always "user":
 * roles are only ever changed by an admin through PUT or by scripts/create-admins.ts.
 */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const body = await request.json().catch(() => null);
  if (!body?.email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  const data = profileToData(parsed.data);

  const saved = await prisma.user.upsert({
    where: { id: user.id },
    // existing rows keep their role/verification; only profile fields are refreshed
    update: { ...data, email: String(body.email) },
    create: { id: user.id, email: String(body.email), htaId: body.htaId ?? "", ...data, role: "user", provider: body.provider || "email" },
  });
  return NextResponse.json(mapPrismaUserToProfile(saved), { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const body = await request.json().catch(() => ({}));
  const id = body.id || user.id;
  if (user.role !== "admin" && id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  const data: Record<string, unknown> = profileToData(parsed.data);
  if (user.role === "admin" && body.role) data.role = body.role;

  const updated = await prisma.user.update({ where: { id }, data });
  return NextResponse.json(mapPrismaUserToProfile(updated));
});

/** Admin only, paginated. */
export const GET = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { skip, take } = parsePagination(request.url);
  const [users, total] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
    prisma.user.count(),
  ]);
  return NextResponse.json({ users: users.map(mapPrismaUserToProfile), total, page: Math.floor(skip / take) + 1, pageSize: take });
});
