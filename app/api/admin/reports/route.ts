import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";

export const runtime = "nodejs";

/** Reported partner posts, hidden ones first. */
export const GET = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const calls = await prisma.teamCall.findMany({
    where: { reports: { some: {} } },
    select: { id: true, title: true, competition: true, hiddenAt: true, status: true, owner: { select: { name: true, email: true } }, reports: { select: { reason: true, createdAt: true } } },
    orderBy: [{ hiddenAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    take: 100,
  });
  return NextResponse.json({ ok: true, calls });
});

/** { id, action: "restore" | "hide" }. Restoring clears the reports so the post starts fresh. */
export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const b = (await request.json().catch(() => null)) as { id?: string; action?: string } | null;
  if (!b?.id || !["restore", "hide"].includes(b.action ?? "")) throw new HttpError(422, "Send an id and an action.");
  if (b.action === "restore") {
    await prisma.$transaction([prisma.postReport.deleteMany({ where: { callId: b.id } }), prisma.teamCall.update({ where: { id: b.id }, data: { hiddenAt: null } })]);
  } else {
    await prisma.teamCall.update({ where: { id: b.id }, data: { hiddenAt: new Date() } });
  }
  return NextResponse.json({ ok: true });
});
