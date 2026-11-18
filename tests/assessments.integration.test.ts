// Runs the real rules against a local Postgres. Skipped when DATABASE_URL is not set.
// Fixtures are created with a random suffix and removed afterwards.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("assessments (database)", () => {
  const sfx = Math.random().toString(36).slice(2, 8);
  let A: typeof import("@/lib/assessments");
  let prisma: typeof import("@/lib/prisma").prisma;
  let user: { id: string; nim: string | null }, other: { id: string; nim: string | null };
  let eventId: string, pre: { id: string }, post: { id: string }, survey: { id: string };
  const mc = (id: string, correct: string, extra: object = {}) => ({ id, type: "multiple_choice", text: id, options: ["a", "b", "c"], correctAnswer: correct, points: 10, explanation: `why ${id}`, ...extra });

  beforeAll(async () => {
    A = await import("@/lib/assessments");
    prisma = (await import("@/lib/prisma")).prisma;
    const mk = (n: string, nim: string | null) => prisma.user.create({ data: { id: `u-${n}-${sfx}`, email: `${n}-${sfx}@x.test`, name: n, nim } });
    user = await mk("u1", `1311${sfx.length}${Math.floor(Math.random() * 1e3).toString().padStart(3, "0")}`.slice(0, 8)) as never;
    other = await mk("nonim", null) as never;
    const ev = await prisma.event.create({ data: { slug: `it-${sfx}`, type: "bootcamp", title: "IT", description: "d", shortDescription: "s", modules: [], speakers: [], createdBy: user.id, startDate: new Date(), endDate: new Date(), registrationDeadline: new Date(Date.now() + 1e9), maxParticipants: 5, location: "x" } });
    eventId = ev.id;
    await prisma.registration.create({ data: { userId: user.id, eventId, status: "confirmed" } });
    const base = { eventId, pairKey: `p-${sfx}`, episode: 1, access: "registered", opensAt: new Date(Date.now() - 1000) };
    pre = await prisma.test.create({ data: { ...base, key: `pre-${sfx}`, kind: "pre_test", type: "pre", title: "Pre", durationMinutes: 10, passingScore: 70, showAnswersAfter: "pair_closed", questions: [mc("q1", "a"), mc("q2", "b"), { id: "c1", type: "likert", text: "c", scale: 5, points: 0, required: true }] } });
    post = await prisma.test.create({ data: { ...base, key: `post-${sfx}`, kind: "post_test", type: "post", title: "Post", durationMinutes: 10, passingScore: 70, showAnswersAfter: "submit", questions: [mc("q1", "a"), mc("q2", "b"), { id: "c1", type: "likert", text: "c", scale: 5, points: 0, required: true }] } });
    survey = await prisma.test.create({ data: { ...base, key: `sv-${sfx}`, kind: "survey", type: "post", title: "Sv", durationMinutes: 0, passingScore: 0, showAnswersAfter: "never", questions: [], sections: [{ title: "s", questions: [{ id: "n1", type: "nps", text: "n", points: 0, required: true }] }] } });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.testResult.deleteMany({ where: { test: { eventId } } });
    await prisma.testAttempt.deleteMany({ where: { test: { eventId } } });
    await prisma.test.deleteMany({ where: { eventId } });
    await prisma.registration.deleteMany({ where: { eventId } });
    await prisma.event.delete({ where: { id: eventId } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: { endsWith: `-${sfx}@x.test` } } });
    await prisma.$disconnect();
  });

  const t = async (id: string) => (await prisma.test.findUniqueOrThrow({ where: { id } }));

  it("strips answers and explanations from what the browser gets", async () => {
    const qs = A.publicQuestions(await t(pre.id), user.id);
    expect(JSON.stringify(qs)).not.toMatch(/correctAnswer|why q1/);
  });

  it("needs a NIM, an opening time and registration", async () => {
    expect((await A.stateFor(other, await t(pre.id))).state).toBe("needs_nim");
    await prisma.test.update({ where: { id: pre.id }, data: { opensAt: null } });
    expect((await A.stateFor(user, await t(pre.id))).state).toBe("not_open");
    await prisma.test.update({ where: { id: pre.id }, data: { opensAt: new Date(Date.now() - 1000) } });
    expect((await A.stateFor({ id: other.id, nim: "13123456" }, await t(pre.id))).state).toBe("needs_registration");
  });

  it("holds the post-test back until the pre-test is submitted", async () => {
    const s = await A.stateFor(user, await t(post.id));
    expect(s.state).toBe("needs_pre");
  });

  it("runs a pre-test: start, autosave, submit, one attempt only", async () => {
    const test = await t(pre.id);
    expect((await A.startAttempt(user, test)).state).toBe("in_progress");
    await A.saveAttempt(user, test, [{ questionId: "q1", answer: "a" }], ["q2"]);
    const resumed = await A.stateFor(user, test);
    expect(resumed.attempt?.answers).toEqual([{ questionId: "q1", answer: "a" }]);
    expect(resumed.attempt?.flagged).toEqual(["q2"]);
    await expect(A.submitAttempt(user, test, [{ questionId: "q1", answer: "a" }])).rejects.toMatchObject({ status: 422 }); // required confidence item
    const done = await A.submitAttempt(user, test, [{ questionId: "q1", answer: "a" }, { questionId: "q2", answer: "c" }, { questionId: "c1", answer: "3" }]);
    expect(done.state).toBe("submitted");
    expect(done.result?.score).toBeUndefined(); // a pre-test shows only "Recorded"
    await expect(A.submitAttempt(user, test, [])).rejects.toMatchObject({ status: 409 });
    const r = await prisma.testResult.findFirstOrThrow({ where: { testId: pre.id, userId: user.id } });
    expect([r.score, r.maxScore]).toEqual([10, 20]); // the likert item never counts
    expect((await prisma.registration.findFirstOrThrow({ where: { userId: user.id, eventId } })).preTestCompleted).toBe(false); // episode tests do not set the old flags
  });

  it("ends a timed attempt by the server clock, keeping what was saved", async () => {
    const test = await t(post.id);
    await A.startAttempt(user, test);
    await A.saveAttempt(user, test, [{ questionId: "q1", answer: "a" }, { questionId: "q2", answer: "b" }], []);
    await prisma.testAttempt.update({ where: { testId_userId: { testId: post.id, userId: user.id } }, data: { startedAt: new Date(Date.now() - 11 * 60_000) } });
    await expect(A.saveAttempt(user, test, [], [])).rejects.toMatchObject({ status: 409 });
    const s = await A.stateFor(user, test); // finishes it from the saved answers
    expect(s.state).toBe("submitted");
    expect(s.result?.score?.percent).toBe(100);
    expect(s.result?.comparison).toMatchObject({ prePercent: 50, postPercent: 100 });
  });

  it("locks the explanations behind the episode survey, then opens them", async () => {
    let s = await A.stateFor(user, await t(post.id));
    expect(s.result?.review).toBeUndefined();
    expect(s.result?.reviewLocked).toBe("survey");
    const sv = await t(survey.id);
    await A.startAttempt(user, sv);
    await expect(A.submitAttempt(user, sv, [])).rejects.toMatchObject({ status: 422 });
    await A.submitAttempt(user, sv, [{ questionId: "n1", answer: "9" }]);
    s = await A.stateFor(user, await t(post.id));
    expect(s.result?.review?.length).toBe(2);
    expect(s.result?.review?.[0].explanation).toBe("why q1");
  });
});
