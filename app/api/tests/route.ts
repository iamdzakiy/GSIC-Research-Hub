import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { HttpError, withErrorHandler, parsePagination, zodFieldErrors } from "@/lib/api-utils";
import { makeCode } from "@/lib/assessments";
import { legacyType, testFields, testUpdate } from "@/lib/validation/tests";

/**
 * Admin only. This list carries correct answers, so it is never public.
 * Participants use /api/assessments/[id], which strips them until the rules allow.
 */
export const GET = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const eventId = url.searchParams.get("eventId");
  const { skip, take } = parsePagination(url);

  if (id) {
    const test = await prisma.test.findUnique({ where: { id } });
    return NextResponse.json(test ?? { error: "Not found" }, { status: test ? 200 : 404 });
  }
  const where = eventId ? { eventId } : {};
  const [tests, total] = await Promise.all([
    prisma.test.findMany({ where, orderBy: [{ eventId: "asc" }, { episode: "asc" }, { key: "asc" }, { id: "desc" }], skip, take }),
    prisma.test.count({ where }),
  ]);
  return NextResponse.json({ tests, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

async function uniqueCode() {
  for (let i = 0; i < 8; i++) { const c = makeCode(); if (!(await prisma.test.findUnique({ where: { code: c }, select: { id: true } }))) return c; }
  throw new HttpError(500, "Could not make a short code. Try again.");
}

/** Create a test or survey. `{ duplicateOf }` copies one (closed, new key and code). */
export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const body = await request.json().catch(() => null);
  if (body?.duplicateOf) {
    const src = await prisma.test.findUnique({ where: { id: String(body.duplicateOf) } });
    if (!src) throw new HttpError(404, "Test not found.");
    const { id: _id, code: _c, key: _k, opensAt: _o, closesAt: _cl, ...rest } = src; void _id; void _c; void _k; void _o; void _cl;
    const copy = await prisma.test.create({ data: { ...rest, title: `${src.title} (copy)`, code: await uniqueCode(), key: null, opensAt: null, closesAt: null, questions: rest.questions as never, sections: (rest.sections ?? undefined) as never } });
    return NextResponse.json(copy, { status: 201 });
  }
  const parsed = testFields.safeParse(body);
  if (!parsed.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(parsed.error));
  const d = parsed.data;
  const created = await prisma.test.create({
    data: {
      eventId: d.eventId, kind: d.kind, type: legacyType(d.kind), title: d.title, description: d.description ?? null, questions: d.questions as never, sections: (d.sections ?? undefined) as never,
      durationMinutes: d.durationMinutes, passingScore: d.passingScore, key: d.key || null, pairKey: d.pairKey || null, episode: d.episode ?? null, code: await uniqueCode(),
      access: d.access, shuffleQuestions: d.shuffleQuestions, shuffleOptions: d.shuffleOptions, showAnswersAfter: d.showAnswersAfter, opensAt: d.opensAt ?? null, closesAt: d.closesAt ?? null,
    },
  });
  return NextResponse.json(created, { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const parsed = testUpdate.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(parsed.error));
  const { id, regenerateCode, openNow, closeNow, kind, ...d } = parsed.data;
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) if (v !== undefined) data[k] = v;
  if (kind) { data.kind = kind; data.type = legacyType(kind); }
  if (openNow) { data.opensAt = new Date(); data.closesAt = null; }
  if (closeNow) data.closesAt = new Date();
  if (regenerateCode) data.code = await uniqueCode();
  const updated = await prisma.test.update({ where: { id }, data });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (await prisma.testResult.count({ where: { testId: id } })) throw new HttpError(409, "This test has results, so it cannot be deleted. Close it instead.");
  await prisma.test.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
