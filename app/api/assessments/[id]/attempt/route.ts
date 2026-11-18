import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { findTest, saveAttempt } from "@/lib/assessments";

export const runtime = "nodejs";
const body = z.object({
  answers: z.array(z.object({ questionId: z.string().max(60), answer: z.union([z.string().max(5000), z.array(z.string().max(300)).max(20)]) })).max(100),
  flagged: z.array(z.string().max(60)).max(100).default([]),
});

/** Autosave of an attempt in progress. */
export const PUT = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser(request);
  const test = await findTest(params.id);
  if (!test) throw new HttpError(404, "Not found.");
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Bad answers.");
  await saveAttempt(user, test, parsed.data.answers, parsed.data.flagged);
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
});
