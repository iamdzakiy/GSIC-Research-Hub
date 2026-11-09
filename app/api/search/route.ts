import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-utils";
import { liveWhere } from "@/lib/partners";

export const runtime = "nodejs";

/** Search palette: competitions, other opportunities, partner posts and events. Public data only. */
export const GET = withErrorHandler(async (request: Request) => {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return NextResponse.json({ ok: true, results: [] });
  const has = { contains: q, mode: "insensitive" as const };
  const now = new Date();
  const [opps, posts, events] = await Promise.all([
    prisma.opportunity.findMany({
      where: { isPublished: true, status: { notIn: ["archived"] }, OR: [{ title: has }, { organizer: has }, { theme: has }, { tags: { has: q.toLowerCase() } }] },
      select: { slug: true, title: true, organizer: true, type: true, deadline: true }, orderBy: [{ deadline: "asc" }], take: 8,
    }),
    prisma.teamCall.findMany({ where: { ...liveWhere(now), OR: [{ title: has }, { competition: has }, { rolesNeeded: { has: q } }] }, select: { id: true, title: true, competition: true }, take: 5 }),
    prisma.event.findMany({ where: { OR: [{ title: has }, { series: has }] }, select: { slug: true, title: true, comingSoon: true }, take: 4 }),
  ]);
  const results = [
    ...opps.sort((a, b) => Number(b.deadline > now) - Number(a.deadline > now)).map((o) => ({
      group: o.type === "competition" ? "Competitions" : "Opportunities", title: o.title, sub: o.organizer,
      href: o.type === "competition" ? `/competitions/${o.slug}` : `/opportunities/${o.slug}`,
    })),
    ...posts.map((p) => ({ group: "Seeking Partner", title: p.title, sub: p.competition, href: `/partners/${p.id}` })),
    ...events.map((e) => ({ group: "Events", title: e.title, sub: e.comingSoon ? "Coming soon" : "", href: `/events/${e.slug}` })),
  ];
  return NextResponse.json({ ok: true, results });
});
