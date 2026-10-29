import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";

/** Nav badge: applications waiting for the signed-in user's decision. Signed-out callers get 0. */
export const GET = withErrorHandler(async (request: Request) => {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: true, count: 0 });
  const count = await prisma.teamApplication.count({ where: { status: "pending", call: { ownerId: user.id, status: "open" } } });
  return NextResponse.json({ ok: true, count });
});
