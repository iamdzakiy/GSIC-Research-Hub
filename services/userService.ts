import { UserProfile } from "@/lib/types";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const res = await fetch(`/api/users/${uid}`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  await fetch(`/api/users/${uid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}