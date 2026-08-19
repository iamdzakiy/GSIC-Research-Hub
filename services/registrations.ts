import { Registration } from "@/lib/types";

export async function getRegistrations(): Promise<Registration[]> {
  const res = await fetch("/api/registrations");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function createRegistration(data: Partial<Registration>) {
  const res = await fetch("/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

export async function updateRegistration(id: string, data: Partial<Registration>) {
  const res = await fetch("/api/registrations", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

export async function deleteRegistration(id: string) {
  const res = await fetch("/api/registrations", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}