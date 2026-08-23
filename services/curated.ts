import { CuratedOpportunity } from "@/lib/types";

export async function getCurated(params?: { page?: number; pageSize?: number }): Promise<CuratedOpportunity[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/curated${suffix}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.curated || []);
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