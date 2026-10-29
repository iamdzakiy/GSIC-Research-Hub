import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";

/** The signed-in user's registrations with their events (meeting link included: they are registered). */
export const GET = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const rows = await prisma.registration.findMany({
    where: { userId: user.id, status: { not: "cancelled" } },
    include: { event: true },
    orderBy: { event: { startDate: "asc" } },
  });
  return NextResponse.json({
    ok: true,
    registrations: rows.map((r) => ({
      id: r.id, status: r.status, preTestCompleted: r.preTestCompleted, postTestCompleted: r.postTestCompleted, details: r.details,
      event: {
        id: r.event.id, slug: r.event.slug, type: r.event.type, title: r.event.title, startDate: r.event.startDate, endDate: r.event.endDate,
        dateLabel: r.event.dateLabel, mode: r.event.mode, location: r.event.location, meetingUrl: r.event.meetingUrl,
        hasPreTest: r.event.hasPreTest, hasPostTest: r.event.hasPostTest,
      },
    })),
  });
});
