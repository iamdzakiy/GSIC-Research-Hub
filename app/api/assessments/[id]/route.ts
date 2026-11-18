import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { findTest, stateFor } from "@/lib/assessments";

export const runtime = "nodejs";

/** The signed-in person's view of one test or survey: what they may do now, and nothing they may not see yet. */
export const GET = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser(request);
  const test = await findTest(params.id);
  if (!test) throw new HttpError(404, "Not found.");
  return NextResponse.json({ ok: true, ...(await stateFor(user, test)) });
});
