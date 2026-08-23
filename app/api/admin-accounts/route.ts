import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";

// List admin accounts (derived from User.role === "admin")
export const GET = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(admins);
});

// Promote a user to admin by email or id
export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const body = await request.json();
  if (!body.id && !body.email) {
    return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: body.id ? { id: body.id } : { email: body.email },
    data: { role: "admin" },
  });
  return NextResponse.json(updated, { status: 201 });
});

// Demote a user from admin (requires the target id/email)
export const DELETE = withErrorHandler(async (request: Request) => {
  const admin = await requireAdmin(request);

  const { id, email } = await request.json();
  const targetId = id || (email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }).then((u) => u?.id) : undefined);
  if (!targetId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (targetId === admin.id) {
    return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: targetId },
    data: { role: "user" },
  });
  return NextResponse.json({ success: true });
});