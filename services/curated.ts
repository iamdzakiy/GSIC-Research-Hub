import { CuratedOpportunity } from "@/lib/types";

export async function getCurated(): Promise<CuratedOpportunity[]> {
  const res = await fetch("/api/curated");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function createCurated(data: Partial<CuratedOpportunity>) {
  const res = await fetch("/api/curated", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

export async function deleteCurated(id: string) {
  const res = await fetch("/api/curated", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}