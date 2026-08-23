import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { mapPrismaUserToProfile } from "@/services/userService";

export const GET = withErrorHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const requester = await requireUser(request);

    // Only allow a user to fetch their own profile unless the requester is an admin
    if (requester.role !== "admin" && requester.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(mapPrismaUserToProfile(user));
  }
);

export const PUT = withErrorHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const requester = await requireUser(request);

    // Only allow a user to update their own profile unless the requester is an admin
    if (requester.role !== "admin" && requester.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

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
    if (requester.role === "admin") {
      data.role = body.role;
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(mapPrismaUserToProfile(updated));
  }
);
