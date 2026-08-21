import { Speaker } from "@/lib/types";

export async function getSpeakers(): Promise<Speaker[]> {
  const res = await fetch("/api/speakers");
  if (!res.ok) throw new Error("Failed to fetch speakers");
  return res.json();
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