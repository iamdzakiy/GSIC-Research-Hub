import { UserProfile } from "@/lib/types";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const res = await fetch(`/api/users/${uid}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch profile");
  }
  return res.json();
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  const res = await fetch("/api/users", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: uid, ...profile }),
  });
  if (!res.ok) throw new Error("Failed to save profile");
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error("Failed to create profile");
}

export async function getAllUsers(params?: { page?: number; pageSize?: number }): Promise<UserProfile[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/users${suffix}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.users || []);
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch("/api/users", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: uid, ...updates }),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}