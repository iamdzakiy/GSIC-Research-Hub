import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { mapPrismaUserToProfile } from "@/services/userService";
import { profileUpdateSchema, profileToData } from "@/lib/validation/profile";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const requester = await requireUser(request);
  if (requester.role !== "admin" && requester.id !== params.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(mapPrismaUserToProfile(user));
});

export const PUT = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const requester = await requireUser(request);
  if (requester.role !== "admin" && requester.id !== params.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile data", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message])) }, { status: 400 });

  const data: Record<string, unknown> = profileToData(parsed.data);
  // Only admins can change roles or the verified-member flag.
  if (requester.role === "admin") {
    if (body.role === "admin" || body.role === "user") data.role = body.role;
    if (typeof body.isVerified === "boolean") data.isVerified = body.isVerified;
  }
  const updated = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json(mapPrismaUserToProfile(updated));
});
