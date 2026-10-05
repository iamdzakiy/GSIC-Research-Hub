import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";
import { submitTestForUser, SubmitError } from "@/lib/test-submit";
import { z } from "zod";

/** Admin: every result (paginated). Everyone else: only their own. Never public. */
export const GET = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  const { skip, take } = parsePagination(request.url);
  const where = me.role === "admin" ? {} : { userId: me.id };
  const [testResults, total] = await Promise.all([
    prisma.testResult.findMany({ where, orderBy: { completedAt: "desc" }, skip, take }),
    prisma.testResult.count({ where }),
  ]);
  return NextResponse.json({ testResults, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

const submitSchema = z.object({
  testId: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string().min(1), answer: z.string().max(5000) })).max(200),
});

/** Client sends ONLY {testId, answers}; score/userId are computed server-side (see lib/test-submit.ts). */
export const POST = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  try {
    return NextResponse.json(await submitTestForUser(me.id, parsed.data.testId, parsed.data.answers), { status: 201 });
  } catch (e) {
    if (e instanceof SubmitError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.testResult.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
