import { Test, TestAnswer, TestQuestion, TestResult } from "@/lib/types";
import { apiFetch, extractError } from "@/lib/apiFetch";

export async function getTests(params?: { page?: number; pageSize?: number; eventId?: string }): Promise<Test[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.eventId) qs.set("eventId", params.eventId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/tests${suffix}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.tests || []);
}

/**
 * Deterministic, server-authoritative scoring engine.
 * - Multiple choice: full points when the answer matches `correctAnswer`.
 * - Essay: awarded `points` when the participant has supplied a non-empty
 *   response (auto-graded by attendance; admin can grade later).
 */
export function computeScore(questions: TestQuestion[], answers: TestAnswer[]): { score: number; maxScore: number } {
  let score = 0;
  let maxScore = 0;

  for (const q of questions) {
    maxScore += q.points || 0;
    const answer = answers.find((a) => a.questionId === q.id);

    if (!answer || !answer.answer) continue;

    if (q.type === "multiple_choice") {
      const correct = (q.correctAnswer || "").trim().toLowerCase();
      if (correct && answer.answer.trim().toLowerCase() === correct) {
        score += q.points || 0;
      }
    } else {
      // Essay: earn points by providing a response.
      score += q.points || 0;
    }
  }

  return { score, maxScore };
}

export interface SubmitTestResult extends TestResult {}

/** Submits answers for a test and returns the scored result. */
export async function submitTest(testId: string, answers: TestAnswer[]): Promise<SubmitTestResult> {
  const res = await apiFetch(`/api/tests/${testId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function createTest(data: Partial<Test>) {
  const res = await apiFetch("/api/tests", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateTest(id: string, data: Partial<Test>) {
  const res = await apiFetch(`/api/tests/${id}`, {
    method: "PUT",
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteTest(id: string) {
  const res = await apiFetch("/api/tests", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

/**
 * Aggregates test analytics across all results for a single test.
 */
export function summarizeResults(results: TestResult[]): {
  count: number;
  averageScore: number;
  maxScore: number;
  passRate: number;
  passingScore: number;
} {
  if (!results.length) {
    return { count: 0, averageScore: 0, maxScore: 0, passRate: 0, passingScore: 0 };
  }
  const maxScore = Math.max(...results.map((r) => r.maxScore), 1);
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  return { count: results.length, averageScore, maxScore, passRate: 0, passingScore: 0 };
}