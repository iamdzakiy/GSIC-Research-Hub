import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDeadlineIcs } from "@/lib/ics";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const o = await prisma.opportunity.findFirst({ where: { OR: [{ slug: params.slug }, { id: params.slug }] }, select: { id: true, slug: true, title: true, organizer: true, deadline: true } });
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
  const body = buildDeadlineIcs({ ...o, url: `${origin}/opportunities/${o.slug}` });
  return new NextResponse(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="deadline-${o.slug}.ics"` } });
}
