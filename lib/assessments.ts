// Server side of pre-tests, post-tests and surveys: who may take one, the clock, autosave, submit and what comes back.
// The browser never sees correct answers or explanations until the rules in `reviewAllowed` say so.
import "server-only";
import type { Test, TestAttempt, TestResult } from "../generated/prisma/client";
import { HttpError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { SCORED_TYPES, answerText, normalisedGain, pct, questionsOf, scoreTest, validateAnswers, type AnswerIn, type Question, type QuestionResult } from "@/lib/scoring";
import { seededShuffle } from "@/lib/shuffle";

export const GRACE_SEC = 15;
export type AState = "not_open" | "closed" | "needs_nim" | "needs_registration" | "needs_pre" | "ready" | "in_progress" | "submitted";

export interface PublicQuestion { id: string; type: Question["type"]; text: string; options?: string[]; scale?: number; lowLabel?: string; highLabel?: string; maxLength?: number; required?: boolean }
export interface PublicTest {
  id: string; code: string | null; key: string | null; title: string; description: string | null; kind: string; episode: number | null; pairKey: string | null;
  durationMinutes: number; questionCount: number; passingScore: number; eventSlug: string | null; eventTitle: string | null; sections: { title: string; ids: string[] }[] | null;
  /** Bootcamp pre/post tests: finishing the episode survey unlocks the explanations and the rapor entry. */
  surveyUnlocks: boolean;
}

export interface ReviewItem extends Pick<QuestionResult, "questionId" | "text" | "answer" | "correctAnswer" | "correct" | "explanation"> { type: string }
export interface SubmittedPayload {
  kind: string; submittedAt: string; durationSec: number | null;
  /** Post-test only. */
  score?: { percent: number; correct: number; total: number; passed: boolean | null; passingScore: number };
  comparison?: { prePercent: number; postPercent: number; gain: number | null; delta: number } | null;
  review?: ReviewItem[]; reviewLocked?: "survey" | null;
  surveyHref?: string | null; nextHref?: string | null;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeCode(rand: () => number = Math.random): string { return Array.from({ length: 6 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join(""); }

export const isTimed = (t: Pick<Test, "kind" | "durationMinutes">) => t.kind !== "survey" && t.durationMinutes > 0;
export const deadlineOf = (t: Pick<Test, "durationMinutes">, startedAt: Date) => new Date(startedAt.getTime() + t.durationMinutes * 60_000);

export async function findTest(idOrCode: string): Promise<Test | null> {
  return prisma.test.findFirst({ where: { OR: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }] } });
}

async function eventOf(eventId: string) {
  return prisma.event.findUnique({ where: { id: eventId }, select: { id: true, slug: true, title: true, type: true } });
}

/** Questions as the browser may see them: no answers, shuffled per person so a resumed test looks the same on any device. */
export function publicQuestions(test: Test, userId: string): PublicQuestion[] {
  let qs = questionsOf(test);
  if (test.shuffleQuestions) {
    const mc = qs.filter((q) => q.type === "multiple_choice");
    const order = seededShuffle(mc, `${userId}:${test.id}:q`);
    let i = 0;
    qs = qs.map((q) => (q.type === "multiple_choice" ? order[i++] : q));
  }
  return qs.map((q) => ({
    id: q.id, type: q.type, text: q.text, scale: q.scale, lowLabel: q.lowLabel, highLabel: q.highLabel, maxLength: q.maxLength, required: SCORED_TYPES.includes(q.type) ? undefined : q.required === true,
    options: q.options ? (test.shuffleOptions && (q.type === "multiple_choice" || q.type === "single_choice") ? seededShuffle(q.options, `${userId}:${test.id}:${q.id}`) : q.options) : undefined,
  }));
}

export async function toPublicTest(test: Test): Promise<PublicTest> {
  const ev = await eventOf(test.eventId);
  const sections = Array.isArray(test.sections) ? (test.sections as { title?: string; questions?: { id: string }[] }[]).map((s) => ({ title: s.title ?? "", ids: (s.questions ?? []).map((q) => q.id) })) : null;
  return {
    id: test.id, code: test.code, key: test.key, title: test.title, description: test.description, kind: test.kind, episode: test.episode, pairKey: test.pairKey,
    durationMinutes: isTimed(test) ? test.durationMinutes : 0, questionCount: questionsOf(test).length, passingScore: test.passingScore,
    eventSlug: ev?.slug ?? null, eventTitle: ev?.title ?? null, sections, surveyUnlocks: test.kind !== "survey" && test.episode != null,
  };
}

async function activeRegistration(userId: string, eventId: string) {
  const r = await prisma.registration.findUnique({ where: { userId_eventId: { userId, eventId } } });
  return r && r.status !== "cancelled" && r.status !== "waitlisted" ? r : null;
}

/** The test paired with this one by pairKey (the other kind), and the survey for that pair. */
async function siblings(test: Test) {
  if (!test.pairKey) return { pre: null as Test | null, post: null as Test | null, survey: null as Test | null };
  const rows = await prisma.test.findMany({ where: { pairKey: test.pairKey } });
  return { pre: rows.find((r) => r.kind === "pre_test") ?? null, post: rows.find((r) => r.kind === "post_test") ?? null, survey: rows.find((r) => r.kind === "survey") ?? null };
}

const hasResult = async (userId: string, testId: string | undefined | null) => !!testId && !!(await prisma.testResult.findUnique({ where: { testId_userId: { testId, userId } }, select: { id: true } }));

/** Whether answers and explanations may be shown to this person now. */
export async function reviewAllowed(test: Test, userId: string): Promise<{ ok: boolean; lockedBy: "survey" | null }> {
  if (test.showAnswersAfter === "never" || test.kind === "survey") return { ok: false, lockedBy: null };
  const sib = await siblings(test);
  const own = await hasResult(userId, test.id);
  const gateTest = test.showAnswersAfter === "pair_closed" ? sib.post : test;
  if (!own || !(await hasResult(userId, gateTest?.id))) return { ok: false, lockedBy: null };
  if (test.episode != null && sib.survey && !(await hasResult(userId, sib.survey.id))) return { ok: false, lockedBy: "survey" };
  return { ok: true, lockedBy: null };
}

export interface StateOut {
  state: AState; test: PublicTest;
  attempt?: { startedAt: string; deadline: string | null; secondsLeft: number | null; answers: AnswerIn[]; flagged: string[]; questions: PublicQuestion[] };
  result?: SubmittedPayload;
  /** For needs_pre and the post-submit hand-offs. */
  next?: { href: string; label: string } | null;
}

export async function stateFor(user: { id: string; nim: string | null }, test: Test, now = new Date()): Promise<StateOut> {
  const pub = await toPublicTest(test);
  const result = await prisma.testResult.findUnique({ where: { testId_userId: { testId: test.id, userId: user.id } } });
  if (result) return { state: "submitted", test: pub, result: await submittedPayload(user.id, test, result) };

  let attempt = await prisma.testAttempt.findUnique({ where: { testId_userId: { testId: test.id, userId: user.id } } });
  if (attempt && isTimed(test) && now.getTime() > deadlineOf(test, attempt.startedAt).getTime() + GRACE_SEC * 1000) {
    // The clock ran out while the person was away. What they had saved counts.
    const r = await finishFromAttempt(user.id, test, attempt, true);
    return { state: "submitted", test: pub, result: await submittedPayload(user.id, test, r) };
  }
  if (attempt) return { state: "in_progress", test: pub, attempt: attemptOut(user.id, test, attempt, now) };

  if (!test.opensAt || test.opensAt > now) return { state: "not_open", test: pub };
  if (test.closesAt && test.closesAt < now) return { state: "closed", test: pub };
  if (!user.nim) return { state: "needs_nim", test: pub };
  if (test.access === "registered" && !(await activeRegistration(user.id, test.eventId))) return { state: "needs_registration", test: pub };
  if (test.kind === "post_test") {
    const { pre } = await siblings(test);
    if (pre && !(await hasResult(user.id, pre.id))) return { state: "needs_pre", test: pub, next: { href: `/events/${pub.eventSlug}/tests/${pre.id}`, label: "Open the pre-test" } };
  }
  if (test.kind === "survey" && test.episode != null) {
    const { post } = await siblings(test);
    if (post && !(await hasResult(user.id, post.id))) return { state: "needs_pre", test: pub, next: { href: `/events/${pub.eventSlug}/tests/${post.id}`, label: "Open the post-test" } };
  }
  return { state: "ready", test: pub };
}

function attemptOut(userId: string, test: Test, a: TestAttempt, now: Date): NonNullable<StateOut["attempt"]> {
  const deadline = isTimed(test) ? deadlineOf(test, a.startedAt) : null;
  return {
    startedAt: a.startedAt.toISOString(), deadline: deadline?.toISOString() ?? null,
    secondsLeft: deadline ? Math.max(0, Math.round((deadline.getTime() - now.getTime()) / 1000)) : null,
    answers: Array.isArray(a.answers) ? (a.answers as unknown as AnswerIn[]) : [], flagged: Array.isArray(a.flagged) ? (a.flagged as string[]) : [],
    questions: publicQuestions(test, userId),
  };
}

export async function startAttempt(user: { id: string; nim: string | null }, test: Test): Promise<StateOut> {
  const s = await stateFor(user, test);
  if (s.state === "in_progress" || s.state === "submitted") return s;
  if (s.state !== "ready") throw new HttpError(409, STATE_MESSAGE[s.state]);
  try { await prisma.testAttempt.create({ data: { testId: test.id, userId: user.id } }); } catch { /* a double tap: the attempt already exists */ }
  return stateFor(user, test);
}

const STATE_MESSAGE: Record<Exclude<AState, "ready" | "in_progress" | "submitted">, string> = {
  not_open: "This is not open yet.", closed: "This has closed.", needs_nim: "Add your NIM first.", needs_registration: "Register for the event first.", needs_pre: "Finish the earlier step first.",
};

/** Autosave. Answers are checked for shape only, so a half-finished test can always be saved. */
export async function saveAttempt(user: { id: string }, test: Test, answers: AnswerIn[], flagged: string[]) {
  const a = await prisma.testAttempt.findUnique({ where: { testId_userId: { testId: test.id, userId: user.id } } });
  if (!a) throw new HttpError(409, "Start first.");
  if (isTimed(test) && Date.now() > deadlineOf(test, a.startedAt).getTime() + GRACE_SEC * 1000) throw new HttpError(409, "Time is up.");
  const ids = new Set(questionsOf(test).map((q) => q.id));
  const clean = answers.filter((x) => x && ids.has(x.questionId)).map((x) => ({ questionId: x.questionId, answer: Array.isArray(x.answer) ? x.answer.slice(0, 20).map((v) => String(v).slice(0, 300)) : String(x.answer ?? "").slice(0, 5000) }));
  await prisma.testAttempt.update({ where: { id: a.id }, data: { answers: clean as never, flagged: flagged.filter((f) => ids.has(f)) as never } });
}

async function finishFromAttempt(userId: string, test: Test, a: TestAttempt, byClock: boolean): Promise<TestResult> {
  const answers = Array.isArray(a.answers) ? (a.answers as unknown as AnswerIn[]) : [];
  return persistResult(userId, test, a, answers, byClock);
}

async function persistResult(userId: string, test: Test, a: TestAttempt, answers: AnswerIn[], byClock: boolean): Promise<TestResult> {
  const scored = scoreTest(questionsOf(test), answers);
  const endedAt = byClock && isTimed(test) ? deadlineOf(test, a.startedAt) : new Date();
  const durationSec = Math.max(0, Math.round((endedAt.getTime() - a.startedAt.getTime()) / 1000));
  const stored = questionsOf(test).map((q) => ({ questionId: q.id, answer: answers.find((x) => x.questionId === q.id)?.answer ?? "" }));
  try {
    const out = await prisma.$transaction(async (tx) => {
      const r = await tx.testResult.create({ data: { testId: test.id, userId, answers: stored as never, score: scored.score, maxScore: scored.maxScore, startedAt: a.startedAt, durationSec, completedAt: endedAt } });
      await tx.testAttempt.deleteMany({ where: { id: a.id } });
      if (test.access === "signed_in" && !(await tx.registration.findUnique({ where: { userId_eventId: { userId, eventId: test.eventId } } }))) {
        await tx.registration.create({ data: { userId, eventId: test.eventId, status: "confirmed", details: { source: "test" } as never } });
      }
      // The two completion flags describe tests with no episode only. Episodes are worked out from results.
      if (test.episode == null && test.kind !== "survey") {
        await tx.registration.updateMany({ where: { userId, eventId: test.eventId }, data: test.kind === "pre_test" ? { preTestCompleted: true } : { postTestCompleted: true } });
      }
      return r;
    });
    return out;
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") { const r = await prisma.testResult.findUnique({ where: { testId_userId: { testId: test.id, userId } } }); if (r) return r; }
    throw e;
  }
}

/** The one authoritative submit. Late by more than 15 seconds: the saved answers are used and the late ones are refused. */
export async function submitAttempt(user: { id: string; nim: string | null }, test: Test, answers: AnswerIn[]): Promise<StateOut> {
  const existing = await prisma.testResult.findUnique({ where: { testId_userId: { testId: test.id, userId: user.id } } });
  if (existing) throw new HttpError(409, "You have already submitted this.");
  const a = await prisma.testAttempt.findUnique({ where: { testId_userId: { testId: test.id, userId: user.id } } });
  if (!a) throw new HttpError(409, "Start first.");
  if (!user.nim) throw new HttpError(403, "Add your NIM first.");
  if (isTimed(test) && Date.now() > deadlineOf(test, a.startedAt).getTime() + GRACE_SEC * 1000) {
    await finishFromAttempt(user.id, test, a, true);
    throw new HttpError(409, "Time ran out before this arrived. Your saved answers were submitted.");
  }
  if (test.kind === "survey" && test.closesAt && test.closesAt < new Date()) throw new HttpError(409, "This has closed.");
  const errs = validateAnswers(questionsOf(test), answers, true);
  if (Object.keys(errs).length) throw new HttpError(422, "Check the highlighted questions.", errs);
  await persistResult(user.id, test, a, answers, false);
  return stateFor(user, test);
}

async function submittedPayload(userId: string, test: Test, r: TestResult): Promise<SubmittedPayload> {
  const base: SubmittedPayload = { kind: test.kind, submittedAt: r.completedAt.toISOString(), durationSec: r.durationSec };
  const ev = await eventOf(test.eventId);
  const sib = await siblings(test);
  const href = (t: Test | null) => (t && ev?.slug ? `/events/${ev.slug}/tests/${t.id}` : null);
  if (test.kind === "survey") return { ...base, nextHref: ev?.slug ? `/events/${ev.slug}` : null };
  if (test.kind === "pre_test") return { ...base, nextHref: ev?.slug ? `/events/${ev.slug}` : null };
  const total = questionsOf(test).filter((q) => q.type === "multiple_choice").length;
  const scored = scoreTest(questionsOf(test), Array.isArray(r.answers) ? (r.answers as unknown as AnswerIn[]) : []);
  const percent = pct(r.score, r.maxScore);
  const preRes = sib.pre ? await prisma.testResult.findUnique({ where: { testId_userId: { testId: sib.pre.id, userId } } }) : null;
  const prePercent = preRes ? pct(preRes.score, preRes.maxScore) : null;
  const rv = await reviewAllowed(test, userId);
  return {
    ...base,
    score: { percent, correct: scored.detail.filter((d) => d.correct).length, total, passed: test.passingScore > 0 ? percent >= test.passingScore : null, passingScore: test.passingScore },
    comparison: prePercent == null ? null : { prePercent, postPercent: percent, gain: normalisedGain(prePercent, percent), delta: percent - prePercent },
    review: rv.ok ? scored.detail.filter((d) => d.type === "multiple_choice").map((d) => ({ questionId: d.questionId, type: d.type, text: d.text, answer: d.answer, correctAnswer: d.correctAnswer, correct: d.correct, explanation: d.explanation })) : undefined,
    reviewLocked: rv.lockedBy, surveyHref: rv.lockedBy === "survey" ? href(sib.survey) : null, nextHref: ev?.slug ? `/events/${ev.slug}` : null,
  };
}

/** Counts for the admin panel and the projector view. Never any answers. */
export async function liveCounts(testId: string) {
  const [started, submitted] = await Promise.all([prisma.testAttempt.count({ where: { testId } }), prisma.testResult.count({ where: { testId } })]);
  return { inProgress: started, submitted, started: started + submitted };
}

export { answerText };
