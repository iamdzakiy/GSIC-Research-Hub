import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { submitTestForUser, SubmitError } from "@/lib/test-submit";

type Ctx = { params: { id: string } };

/** Used by services/tests.ts#submitTest. Same guarded path as POST /api/test-results. */
export const POST = withErrorHandler(async (request: Request, ctx: Ctx) => {
  const user = await requireUser(request);
  const body = await request.json().catch(() => null);
  const answers = Array.isArray(body?.answers)
    ? body.answers.filter((a: unknown) => a && typeof (a as { questionId?: unknown }).questionId === "string").map((a: { questionId: string; answer?: unknown }) => ({ questionId: a.questionId, answer: String(a.answer ?? "") }))
    : [];
  try {
    return NextResponse.json(await submitTestForUser(user.id, ctx.params.id, answers));
  } catch (e) {
    if (e instanceof SubmitError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
});
