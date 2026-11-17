import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { enqueue } from "@/lib/outbox";
import { resultsSheetConfigured } from "@/lib/results-sheet";

export const runtime = "nodejs";

/** Admin: queue "Sync to sheet" for one event. One tab per test, written by the outbox. */
export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const body = (await request.json().catch(() => null)) as { eventId?: string } | null;
  if (!body?.eventId) throw new HttpError(422, "Missing eventId.");
  if (!resultsSheetConfigured()) throw new HttpError(409, "Google Sheets is not configured. Set GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY and GOOGLE_SHEETS_SPREADSHEET_ID.");
  await enqueue("results_sheet", { eventId: body.eventId });
  return NextResponse.json({ ok: true, queued: true });
});
