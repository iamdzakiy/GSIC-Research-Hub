import { describe, expect, it } from "vitest";
import { gainBand, normalisedGain, scoreTest, validateAnswers, missingAnswers, type Question } from "@/lib/scoring";
import { seededShuffle } from "@/lib/shuffle";

const qs: Question[] = [
  { id: "a", type: "multiple_choice", text: "A", options: ["x", "y"], correctAnswer: "x", points: 10 },
  { id: "b", type: "multiple_choice", text: "B", options: ["x", "y"], correctAnswer: "y", points: 10 },
  { id: "c", type: "likert", text: "C", scale: 5, points: 0, required: true },
  { id: "d", type: "long_text", text: "D", points: 5, maxLength: 10 },
];

describe("scoring", () => {
  it("scores multiple choice by option text and ignores unscored items", () => {
    const r = scoreTest(qs, [{ questionId: "a", answer: "X" }, { questionId: "b", answer: "x" }, { questionId: "c", answer: "5" }, { questionId: "d", answer: "hello" }]);
    expect(r.score).toBe(10);
    expect(r.maxScore).toBe(20);
    expect(r.percent).toBe(50);
  });
  it("gives unscored items 0 points even when the file says otherwise", () => {
    expect(scoreTest(qs, []).maxScore).toBe(20);
  });
  it("counts blank scored items", () => {
    expect(missingAnswers(qs, [{ questionId: "a", answer: "x" }])).toBe(1);
  });
  it("validates required, scale, options and length", () => {
    expect(validateAnswers(qs, [])).toEqual({ c: "Required" });
    expect(validateAnswers(qs, [], false)).toEqual({});
    expect(validateAnswers(qs, [{ questionId: "c", answer: "9" }])).toHaveProperty("c");
    expect(validateAnswers(qs, [{ questionId: "c", answer: "3" }, { questionId: "a", answer: "nope" }])).toHaveProperty("a");
    expect(validateAnswers(qs, [{ questionId: "c", answer: "3" }, { questionId: "d", answer: "x".repeat(11) }])).toHaveProperty("d");
    expect(validateAnswers(qs, [{ questionId: "c", answer: "3" }])).toEqual({});
  });
  it("computes normalised gain and its band", () => {
    expect(normalisedGain(50, 80)).toBeCloseTo(0.6);
    expect(normalisedGain(100, 100)).toBeNull();
    expect(gainBand(0.29)).toBe("low");
    expect(gainBand(0.3)).toBe("medium");
    expect(gainBand(0.7)).toBe("high");
  });
});

describe("seeded shuffle", () => {
  it("is stable for a seed and keeps every item", () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6], "u:t"), b = seededShuffle([1, 2, 3, 4, 5, 6], "u:t");
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(seededShuffle([1, 2, 3, 4, 5, 6], "other")).not.toEqual(a);
  });
});
