import { AdminAccount } from "@/lib/types";

export async function getAdminAccounts(): Promise<AdminAccount[]> {
  const res = await fetch("/api/admin-accounts");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function createAdminAccount(data: Partial<AdminAccount>) {
  const res = await fetch("/api/admin-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}