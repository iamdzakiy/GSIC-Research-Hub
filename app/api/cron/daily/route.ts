import { NextResponse } from "next/server";
import { runDaily } from "@/lib/cron-tasks";
import { drainAll } from "@/lib/outbox";
import { reconcileSheet } from "@/lib/matchmaking-sheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel cron (vercel.json), once a day at 00:00 UTC (07:00 WIB). Protected by CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const out: Record<string, unknown> = {};
  try { out.daily = await runDaily(); } catch (e) { out.dailyError = (e as Error).message; }
  try { out.sheet = await reconcileSheet(); } catch (e) { out.sheetError = (e as Error).message; console.error("[cron] sheet reconcile failed:", e); }
  try { out.outbox = await drainAll(); } catch (e) { out.outboxError = (e as Error).message; }
  console.log("[cron] daily", JSON.stringify(out));
  return NextResponse.json({ ok: true, ...out });
}
