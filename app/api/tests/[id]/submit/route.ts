import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { computeScore } from "@/services/tests";
import { TestQuestion, TestAnswer } from "@/lib/types";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (request: Request, ctx: Ctx) => {
  const user = await requireUser(request);
  const { id } = ctx.params;

  const test = await prisma.test.findUnique({ where: { id } });
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const body = await request.json();
  const answers: TestAnswer[] = Array.isArray(body?.answers) ? body.answers : [];

  // Parse and validate the stored question set (never trust client state).
  const questions = parseQuestions(test.questions);
  const { score, maxScore } = computeScore(questions, answers);

  const result = await prisma.testResult.create({
    data: {
      testId: test.id,
      userId: user.id,
      answers: answers as unknown as Prisma.InputJsonValue,
      score,
      maxScore,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ ...result, passingScore: test.passingScore });
});

/** Safely coerces the JSON questions column into a typed array. */
function parseQuestions(value: unknown): TestQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((q): q is Record<string, unknown> => !!q && typeof q === "object")
    .map((q) => ({
      id: String(q.id ?? ""),
      text: String(q.text ?? ""),
      type: q.type === "essay" ? ("essay" as const) : ("multiple_choice" as const),
      options: Array.isArray(q.options)
        ? (q.options as unknown[]).map((o) => String(o))
        : undefined,
      correctAnswer: q.correctAnswer !== undefined ? String(q.correctAnswer) : undefined,
      points: Number(q.points) || 0,
    }));
}