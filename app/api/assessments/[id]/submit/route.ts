import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { findTest, submitAttempt } from "@/lib/assessments";

export const runtime = "nodejs";
const body = z.object({ answers: z.array(z.object({ questionId: z.string().max(60), answer: z.union([z.string().max(5000), z.array(z.string().max(300)).max(20)]) })).max(100) });

export const POST = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser(request);
  const test = await findTest(params.id);
  if (!test) throw new HttpError(404, "Not found.");
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Bad answers.");
  return NextResponse.json({ ok: true, ...(await submitAttempt(user, test, parsed.data.answers)) });
});
