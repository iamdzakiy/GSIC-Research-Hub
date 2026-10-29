import { GSICEvent } from "@/lib/types";
import { apiFetch, extractError } from "@/lib/apiFetch";

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
}

export async function getEvents(params?: { page?: number; pageSize?: number }): Promise<GSICEvent[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await apiFetch(`/api/events${suffix}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.events || []);
}

export async function createEvent(data: Partial<GSICEvent>) {
  const res = await apiFetch("/api/events", { method: "POST", body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateEvent(id: string, data: Partial<GSICEvent>) {
  const res = await apiFetch("/api/events", { method: "PUT", body: JSON.stringify({ id, ...data }) });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteEvent(id: string) {
  const res = await apiFetch("/api/events", { method: "DELETE", body: JSON.stringify({ id }) });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}