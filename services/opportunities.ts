import { Opportunity } from "@/lib/types";

export async function getOpportunities(): Promise<Opportunity[]> {
  const res = await fetch("/api/opportunities");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function createOpportunity(data: Partial<Opportunity>) {
  const res = await fetch("/api/opportunities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

export async function updateOpportunity(id: string, data: Partial<Opportunity>) {
  const res = await fetch("/api/opportunities", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

export async function deleteOpportunity(id: string) {
  const res = await fetch("/api/opportunities", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}