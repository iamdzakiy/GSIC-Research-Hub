import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-utils";
import { liveCounts } from "@/lib/assessments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public counts for the projector view. A title and two numbers, never an answer or a name. */
export const GET = withErrorHandler(async (request: Request) => {
  const code = (new URL(request.url).searchParams.get("code") ?? "").toUpperCase();
  const t = code ? await prisma.test.findUnique({ where: { code }, select: { id: true, title: true, kind: true, opensAt: true, closesAt: true } }) : null;
  if (!t) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  const now = new Date();
  const open = !!t.opensAt && t.opensAt <= now && (!t.closesAt || t.closesAt >= now);
  return NextResponse.json({ ok: true, title: t.title, kind: t.kind, open, ...(await liveCounts(t.id)) }, { headers: { "Cache-Control": "no-store" } });
});
