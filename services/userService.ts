import { UserProfile } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Maps a Prisma User record (with `id`) to the client `UserProfile` (with `uid`). */
export function mapPrismaUserToProfile(u: any): UserProfile {
  return {
    uid: u.id,
    htaId: u.htaId || "",
    email: u.email,
    name: u.name || "",
    faculty: u.faculty || "",
    major: u.major || "",
    majorCode: u.majorCode || undefined,
    year: u.year || new Date().getFullYear(),
    whatsapp: u.whatsapp || "",
    avatarUrl: u.avatarUrl || null,
    classcardTheme: u.classcardTheme || "blue",
    skills: u.skills || [],
    bio: u.bio || "",
    isVerified: u.isVerified || false,
    role: u.role || "user",
    emailConfirmed: u.emailConfirmed || false,
    provider: u.provider || "email",
    lastSignInAt: u.lastSignInAt || null,
    createdAt: u.createdAt || new Date().toISOString(),
    updatedAt: u.updatedAt || undefined,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const res = await fetch(`/api/users/${uid}`, { headers: await getAuthHeaders() });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch profile");
  }
  return mapPrismaUserToProfile(await res.json());
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  const res = await fetch(`/api/users/${uid}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error("Failed to save profile");
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error("Failed to create profile");
}

export async function getAllUsers(params?: { page?: number; pageSize?: number }): Promise<UserProfile[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/users${suffix}`, { headers: await getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.users || []);
  return list.map(mapPrismaUserToProfile);
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`/api/users/${uid}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || "Failed to update profile");
  }
  return mapPrismaUserToProfile(await res.json());
}
