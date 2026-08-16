import { Test } from "@/lib/types";

export async function getTests(): Promise<Test[]> {
  const res = await fetch("/api/tests");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function createTest(data: Partial<Test>) {
  const res = await fetch("/api/tests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}