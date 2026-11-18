import { describe, expect, it } from "vitest";
import { buildRaporV3, type RTest } from "@/lib/rapor";

const mc = (id: string, a: string) => ({ id, type: "multiple_choice", text: id, options: ["a", "b"], correctAnswer: a, points: 10, explanation: `e-${id}` });
const t = (id: string, kind: string, extra: Partial<RTest> = {}): RTest => ({ id, eventId: "ev", kind, pairKey: "p1", episode: 1, title: id, passingScore: 70, showAnswersAfter: kind === "pre_test" ? "pair_closed" : "submit", questions: [mc("q1", "a"), mc("q2", "b")], ...extra });
const ev = { id: "ev", title: "Bootcamp", type: "bootcamp", startDate: null, location: "x" };
const reg = [{ eventId: "ev", registeredAt: "2026-01-01" }];
const r = (testId: string, score: number, answers: unknown[] = []) => ({ testId, score, maxScore: 20, answers, completedAt: "2026-01-02" });

describe("rapor v3", () => {
  const tests = [t("pre", "pre_test"), t("post", "post_test"), t("sv", "survey", { questions: [] })];
  it("shows what is still to do, and hides an episode until its survey is done", () => {
    let out = buildRaporV3(reg, [ev], tests, [r("pre", 10)]);
    expect(out.events[0].episodes[0].status).toBe("post_pending");
    expect(out.events[0].todo[0].testId).toBe("post");
    out = buildRaporV3(reg, [ev], tests, [r("pre", 10), r("post", 20)]);
    const ep = out.events[0].episodes[0];
    expect(ep.status).toBe("survey_pending");
    expect(ep.locked).toBe(true);
    expect(ep.postPercent).toBeNull();
    expect(ep.review).toBeNull();
  });
  it("opens the episode, with normalised gain and the explanations, after the survey", () => {
    const answers = [{ questionId: "q1", answer: "a" }, { questionId: "q2", answer: "a" }];
    const out = buildRaporV3(reg, [ev], tests, [r("pre", 10), r("post", 20, answers), r("sv", 0)]);
    const ep = out.events[0].episodes[0];
    expect(ep.status).toBe("completed");
    expect([ep.prePercent, ep.postPercent, ep.delta]).toEqual([50, 100, 50]);
    expect(ep.nGain).toBe(1);
    expect(ep.band).toBe("high");
    expect(ep.review?.[0].explanation).toBe("e-q1");
    expect(ep.review?.[1].correct).toBe(false);
    expect(out.summary.avgGain).toBe(50);
  });
  it("says already full when the pre-test was 100", () => {
    const out = buildRaporV3(reg, [ev], [t("pre", "pre_test"), t("post", "post_test")], [r("pre", 20), r("post", 20)]);
    const ep = out.events[0].episodes[0];
    expect(ep.fullAlready).toBe(true);
    expect(ep.nGain).toBeNull();
  });
  it("leaves pass or fail out when there is no passing score", () => {
    const out = buildRaporV3(reg, [ev], [t("pre", "pre_test", { passingScore: 0 }), t("post", "post_test", { passingScore: 0 })], [r("pre", 5), r("post", 10)]);
    expect(out.events[0].episodes[0].passed).toBeNull();
  });
  it("averages the two confidence items", () => {
    const pre = r("pre", 10, [{ questionId: "e1pre-c1", answer: "2" }, { questionId: "e1pre-c2", answer: "3" }]);
    const post = r("post", 20, [{ questionId: "e1post-c1", answer: "4" }, { questionId: "e1post-c2", answer: "5" }]);
    expect(buildRaporV3(reg, [ev], [t("pre", "pre_test"), t("post", "post_test")], [pre, post]).events[0].confidence).toEqual({ pre: 2.5, post: 4.5 });
  });
});
