import { TestResult } from "@/lib/types";

export async function getTestResults(): Promise<TestResult[]> {
  const res = await fetch("/api/test-results");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function createTestResult(data: Partial<TestResult>) {
  const res = await fetch("/api/test-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

export async function deleteTestResult(id: string) {
  const res = await fetch("/api/test-results", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}