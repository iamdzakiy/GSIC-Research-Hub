import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

// Create a new user profile (authenticated)
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);

  const body = await request.json();
  if (!body.email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const newUser = await prisma.user.upsert({
    where: { id: body.id || user.id },
    update: {
      name: body.name,
      email: body.email,
      faculty: body.faculty,
      major: body.major,
      majorCode: body.majorCode,
      year: body.year ? parseInt(body.year) : undefined,
      whatsapp: body.whatsapp,
      avatarUrl: body.avatarUrl,
      classcardTheme: body.classcardTheme || "blue",
      skills: body.skills || [],
      bio: body.bio,
      isVerified: body.isVerified || false,
      role: body.role || "user",
      emailConfirmed: body.emailConfirmed ?? user.emailConfirmed ? true : false,
      provider: body.provider || "email",
      lastSignInAt: body.lastSignInAt ? new Date(body.lastSignInAt) : undefined,
    },
    create: {
      id: body.id || user.id,
      name: body.name,
      email: body.email,
      faculty: body.faculty,
      major: body.major,
      majorCode: body.majorCode,
      year: body.year ? parseInt(body.year) : undefined,
      whatsapp: body.whatsapp,
      avatarUrl: body.avatarUrl,
      classcardTheme: body.classcardTheme || "blue",
      skills: body.skills || [],
      bio: body.bio,
      isVerified: body.isVerified || false,
      role: body.role || "user",
      emailConfirmed: body.emailConfirmed ?? user.emailConfirmed ? true : false,
      provider: body.provider || "email",
      lastSignInAt: body.lastSignInAt ? new Date(body.lastSignInAt) : undefined,
    },
  });
  return NextResponse.json(newUser, { status: 201 });
});

// Update a user profile — non-admins can only update their own profile
export const PUT = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);

  const body = await request.json();
  const id = body.id || user.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Non-admin users may only update their own account
  if (user.role !== "admin" && id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent non-admin users from escalating their own role
  const data: Record<string, unknown> = {
    name: body.name,
    email: body.email,
    faculty: body.faculty,
    major: body.major,
    majorCode: body.majorCode,
    year: body.year !== undefined ? parseInt(body.year) : undefined,
    whatsapp: body.whatsapp,
    avatarUrl: body.avatarUrl,
    classcardTheme: body.classcardTheme,
    skills: body.skills,
    bio: body.bio,
    isVerified: body.isVerified,
    emailConfirmed: body.emailConfirmed,
    provider: body.provider,
    lastSignInAt: body.lastSignInAt ? new Date(body.lastSignInAt) : undefined,
  };
  if (user.role === "admin") {
    data.role = body.role;
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
});

// Get all users (admin only, paginated)
export const GET = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const { skip, take } = parsePagination(request.url);
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.user.count(),
  ]);
  return NextResponse.json({ users, total, page: Math.floor(skip / take) + 1, pageSize: take });
});