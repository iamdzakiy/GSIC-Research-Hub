import { Speaker } from "@/lib/types";

export async function getSpeakers(params?: { page?: number; pageSize?: number }): Promise<Speaker[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/speakers${suffix}`);
  if (!res.ok) throw new Error("Failed to fetch speakers");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.speakers || []);
}

export async function createSpeaker(data: Partial<Speaker>) {
  const res = await fetch("/api/speakers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create speaker");
  return res.json();
}

export async function updateSpeaker(id: string, data: Partial<Speaker>) {
  const res = await fetch("/api/speakers", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) throw new Error("Failed to update speaker");
  return res.json();
}

export async function deleteSpeaker(id: string) {
  const res = await fetch("/api/speakers", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete speaker");
  return res.json();
}