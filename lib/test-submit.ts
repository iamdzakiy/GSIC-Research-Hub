import "server-only";
import { prisma } from "@/lib/prisma";
import { missingAnswers, scoreTest, type AnswerIn, type Question } from "@/lib/scoring";

export class SubmitError extends Error { constructor(message: string, public status: number) { super(message); } }

/** Single authoritative path for submitting a pre/post test (used by both API routes). */
export async function submitTestForUser(userId: string, testId: string, answers: AnswerIn[]) {
  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) throw new SubmitError("Test not found.", 404);
  const reg = await prisma.registration.findFirst({ where: { userId, eventId: test.eventId } });
  if (!reg) throw new SubmitError("You are not registered for this event.", 403);
  if (test.type === "post" && !reg.preTestCompleted) throw new SubmitError("Complete the pre-test first.", 409);
  if (await prisma.testResult.findFirst({ where: { userId, testId } })) throw new SubmitError("You have already submitted this test.", 409);

  const questions = (Array.isArray(test.questions) ? test.questions : []) as unknown as Question[];
  const missing = missingAnswers(questions, answers);
  if (missing > 0) throw new SubmitError(`${missing} ${missing === 1 ? "question is" : "questions are"} still unanswered. Answer all questions and submit again.`, 400);

  const scored = scoreTest(questions, answers);
  const [result] = await prisma.$transaction([
    prisma.testResult.create({ data: { testId, userId, answers: answers as never, score: scored.score, maxScore: scored.maxScore } }),
    prisma.registration.update({ where: { id: reg.id }, data: test.type === "pre" ? { preTestCompleted: true } : { postTestCompleted: true } }),
  ]);
  return { ...result, percent: scored.percent, passingScore: test.passingScore, passed: scored.percent >= test.passingScore };
}
