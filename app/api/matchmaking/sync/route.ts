import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { syncAllProfiles } from "@/lib/matchmaking-sheet";
import { invalidateSheetCache } from "@/lib/matchmaking-data";

export const runtime = "nodejs";

/** Admin: push every profile to the match-making sheet (rows are matched by Email, others untouched). */
export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  try {
    const result = await syncAllProfiles();
    invalidateSheetCache();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
});
