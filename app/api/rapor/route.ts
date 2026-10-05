import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { buildRapor } from "@/lib/scoring";

export const dynamic = "force-dynamic";

/** The signed-in user's report card. Admins may pass ?userId= to view someone else's. */
export const GET = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  const asUser = new URL(request.url).searchParams.get("userId");
  let userId = me.id;
  if (asUser && asUser !== me.id) { await requireAdmin(request); userId = asUser; }

  const regs = await prisma.registration.findMany({ where: { userId }, orderBy: { registeredAt: "desc" } });
  const eventIds = regs.map((r) => r.eventId);
  const [events, tests, results, profile] = await Promise.all([
    prisma.event.findMany({ where: { id: { in: eventIds } }, select: { id: true, title: true, type: true, startDate: true, location: true } }),
    prisma.test.findMany({ where: { eventId: { in: eventIds } } }),
    prisma.testResult.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, faculty: true, major: true, year: true } }),
  ]);
  const rapor = buildRapor(regs, events, tests as never, results);
  return NextResponse.json({ profile, ...rapor });
});
