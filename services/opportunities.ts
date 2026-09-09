import { Opportunity } from "@/lib/types";
import { apiFetch, extractError } from "@/lib/apiFetch";

export interface OpportunityListResult {
  opportunities: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getOpportunities(params?: {
  page?: number;
  pageSize?: number;
  slug?: string;
  type?: string;
  status?: string;
  search?: string;
}): Promise<Opportunity[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.slug) qs.set("slug", params.slug);
  if (params?.type) qs.set("type", params.type);
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/opportunities${suffix}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.opportunities || []);
}

export async function getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  const res = await fetch(`/api/opportunities?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  const list = await getOpportunities({ slug, pageSize: 1 });
  return list.find((o: Opportunity) => o.slug === slug) || null;
}

/** Finds an opportunity by its primary key (cuid) — used by detail pages. */
export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const all = await getOpportunities({ pageSize: 100 });
  return all.find((o: Opportunity) => o.id === id) || null;
}

export async function createOpportunity(data: Partial<Opportunity>) {
  const res = await apiFetch("/api/opportunities", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateOpportunity(id: string, data: Partial<Opportunity>) {
  const res = await apiFetch("/api/opportunities", {
    method: "PUT",
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteOpportunity(id: string) {
  const res = await apiFetch("/api/opportunities", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}