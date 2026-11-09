import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";

/** Bell: latest 20 notifications and the unread count. Signed-out callers get an empty list. */
export const GET = withErrorHandler(async (request: Request) => {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: true, unread: 0, items: [] });
  const [unread, items] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, kind: true, title: true, body: true, url: true, readAt: true, createdAt: true } }),
  ]);
  return NextResponse.json({ ok: true, unread, items });
});

/** Marks every notification read (opening the bell). */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
});
