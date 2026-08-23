import { UserProfile } from "@/lib/types";

export async function getAdminAccounts(): Promise<UserProfile[]> {
  const res = await fetch("/api/admin-accounts");
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.admins || []);
}

export async function createAdminAccount(data: { id?: string; email?: string } & Record<string, unknown>) {
  const res = await fetch("/api/admin-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

export async function deleteAdminAccount(id: string) {
  const res = await fetch("/api/admin-accounts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}