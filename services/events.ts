import { GSICEvent } from "@/lib/types";

export async function getEvents(): Promise<GSICEvent[]> {
  const res = await fetch("/api/events");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function createEvent(data: Partial<GSICEvent>) {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

export async function updateEvent(id: string, data: Partial<GSICEvent>) {
  const res = await fetch("/api/events", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

export async function deleteEvent(id: string) {
  const res = await fetch("/api/events", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}