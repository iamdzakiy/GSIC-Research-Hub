import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { eventResults } from "@/lib/results-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: results for one event, with optional faculty, major and intake-year filters. */
export const GET = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const q = new URL(request.url).searchParams;
  const eventId = q.get("eventId");
  if (!eventId) return NextResponse.json({ ok: false, error: "Missing eventId" }, { status: 400 });
  const year = Number(q.get("year"));
  return NextResponse.json({ ok: true, ...(await eventResults(eventId, { faculty: q.get("faculty") || undefined, major: q.get("major") || undefined, year: Number.isInteger(year) && year > 0 ? year : undefined })) });
});
