import { Document } from "@/lib/types";
import { apiFetch, extractError } from "@/lib/apiFetch";

export interface DocumentListResult {
  documents: Document[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getDocuments(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  tag?: string;
  eventId?: string;
  opportunityId?: string;
  search?: string;
}): Promise<Document[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.type) qs.set("type", params.type);
  if (params?.tag) qs.set("tag", params.tag);
  if (params?.eventId) qs.set("eventId", params.eventId);
  if (params?.opportunityId) qs.set("opportunityId", params.opportunityId);
  if (params?.search) qs.set("search", params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/documents${suffix}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.documents || []);
}

export async function createDocument(data: Partial<Document>) {
  const res = await apiFetch("/api/documents", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateDocument(id: string, data: Partial<Document>) {
  const res = await apiFetch(`/api/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteDocument(id: string) {
  const res = await apiFetch("/api/documents", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}