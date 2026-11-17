import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { findTest, startAttempt } from "@/lib/assessments";

export const runtime = "nodejs";

export const POST = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser(request);
  const test = await findTest(params.id);
  if (!test) throw new HttpError(404, "Not found.");
  return NextResponse.json({ ok: true, ...(await startAttempt(user, test)) });
});
