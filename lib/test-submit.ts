import "server-only";
import { HttpError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { findTest, startAttempt, stateFor, submitAttempt } from "@/lib/assessments";
import type { AnswerIn } from "@/lib/scoring";

export class SubmitError extends Error { constructor(message: string, public status: number) { super(message); } }

/**
 * Old routes (`POST /api/tests/[id]/submit`, `POST /api/test-results`) go through the same rules as the new runner:
 * opening times, registration, pre-test order, one attempt, the server clock and the NIM.
 */
export async function submitTestForUser(userId: string, testId: string, answers: AnswerIn[]) {
  try {
    const [user, test] = await Promise.all([prisma.user.findUnique({ where: { id: userId }, select: { id: true, nim: true } }), findTest(testId)]);
    if (!user) throw new SubmitError("User not found.", 404);
    if (!test) throw new SubmitError("Test not found.", 404);
    if ((await stateFor(user, test)).state === "ready") await startAttempt(user, test);
    return await submitAttempt(user, test, answers);
  } catch (e) {
    if (e instanceof HttpError) throw new SubmitError(e.message, e.status);
    throw e;
  }
}
