import { Opportunity } from "@/lib/types";

export async function getOpportunities(params?: { page?: number; pageSize?: number; slug?: string }): Promise<Opportunity[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.slug) qs.set("slug", params.slug);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/opportunities${suffix}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.opportunities || []);
}

export async function getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  const res = await fetch(`/api/opportunities?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  const list = await getOpportunities({ slug });
  return list.find((o: Opportunity) => o.slug === slug) || null;
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