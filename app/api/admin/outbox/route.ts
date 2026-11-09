import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { getMarker, outboxStatus, retryFailed } from "@/lib/outbox";

export const runtime = "nodejs";

export const GET = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const [status, lastSheetSyncAt] = await Promise.all([outboxStatus(), getMarker("lastSheetSyncAt")]);
  return NextResponse.json({ ok: true, ...status, lastSheetSyncAt });
});

/** Retry every failed job. */
export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  return NextResponse.json({ ok: true, retried: await retryFailed() });
});
