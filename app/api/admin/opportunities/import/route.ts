import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { extractOpportunity, ImportError } from "@/lib/opportunity-ai";
import { draftToPayload } from "@/lib/opportunity-broadcast";

export const runtime = "nodejs";
export const maxDuration = 120;

const body = z.object({
  text: z.string().trim().max(100_000).optional(),
  url: z.string().trim().url().max(1000).optional().or(z.literal("")),
}).refine((b) => !!b.text || !!b.url, "Paste the text or a link.");

/** Admin AI import: raw text and/or a link -> a draft payload for the opportunity editor. Nothing is saved here. */
export const POST = withErrorHandler(async (request: Request) => {
  const admin = await requireAdmin(request);
  const rl = rateLimit(`opp-import:${admin.id}`, 20, 60 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: `Too many imports. Try again in ${Math.ceil(rl.retryAfterSec / 60)} min.` }, { status: 429 });

  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  try {
    const draft = await extractOpportunity({ text: parsed.data.text || undefined, url: parsed.data.url || undefined });
    return NextResponse.json({ draft, payload: draftToPayload(draft), warnings: draft.warnings });
  } catch (e) {
    if (e instanceof ImportError) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }
});
