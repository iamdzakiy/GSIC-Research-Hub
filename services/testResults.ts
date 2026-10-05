import { TestResult } from "@/lib/types";
import { apiFetch, extractError } from "@/lib/apiFetch";

/** Admin: all results. Regular users: only their own (enforced server-side). */
export async function getTestResults(params?: { page?: number; pageSize?: number }): Promise<TestResult[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const res = await apiFetch(`/api/test-results${qs.toString() ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  return Array.isArray(data) ? data : data.testResults || [];
}

/** Send only {testId, answers}; the server scores it. Prefer submitTest() in services/tests. */
export async function createTestResult(data: { testId: string; answers: { questionId: string; answer: string }[] }) {
  const res = await apiFetch("/api/test-results", { method: "POST", body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteTestResult(id: string) {
  const res = await apiFetch("/api/test-results", { method: "DELETE", body: JSON.stringify({ id }) });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}
