import { UserProfile } from "@/lib/types";
import { getUserProfile as getFirestoreProfile, saveUserProfile as saveFirestoreProfile } from "@/lib/firestore";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return getFirestoreProfile(uid);
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  await saveFirestoreProfile(uid, profile);
}
