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
  // The next open test or survey this person has not submitted, per event: pre-test, then post-test, then survey, by episode.
  const now = new Date();
  const tests = await prisma.test.findMany({
    where: { eventId: { in: rows.map((r) => r.eventId) }, code: { not: null }, opensAt: { lte: now }, OR: [{ closesAt: null }, { closesAt: { gt: now } }] },
    select: { id: true, eventId: true, kind: true, episode: true, title: true, code: true },
  });
  const done = new Set((await prisma.testResult.findMany({ where: { userId: user.id, testId: { in: tests.map((t) => t.id) } }, select: { testId: true } })).map((r) => r.testId));
  const rank = (k: string) => (k === "pre_test" ? 0 : k === "post_test" ? 1 : 2);
  const nextFor = (eventId: string) => {
    const t = tests.filter((x) => x.eventId === eventId && !done.has(x.id)).sort((a, b) => (a.episode ?? 99) - (b.episode ?? 99) || rank(a.kind) - rank(b.kind))[0];
    return t ? { label: t.kind === "survey" ? "Fill in the survey" : t.kind === "post_test" ? "Take the post-test" : "Take the pre-test", href: `/a/${t.code}`, title: t.title } : null;
  };
  return NextResponse.json({
    ok: true,
    registrations: rows.map((r) => ({
      nextTest: nextFor(r.eventId),
      id: r.id, status: r.status, preTestCompleted: r.preTestCompleted, postTestCompleted: r.postTestCompleted, details: r.details,
      event: {
        id: r.event.id, slug: r.event.slug, type: r.event.type, title: r.event.title, startDate: r.event.startDate, endDate: r.event.endDate,
        dateLabel: r.event.dateLabel, mode: r.event.mode, location: r.event.location, meetingUrl: r.event.meetingUrl,
        hasPreTest: r.event.hasPreTest, hasPostTest: r.event.hasPostTest,
      },
    })),
  });
});
