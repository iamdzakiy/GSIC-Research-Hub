import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Opportunity, CuratedOpportunity, GSICEvent, Test, 
  Registration, TestResult, Document, AdminAccount, UserProfile 
} from "./types";

// Helper to generate ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ============================================================
// GENERIC CRUD OPERATIONS
// ============================================================
export async function create<T>(collectionName: string, item: T & { id?: string }): Promise<string> {
  const id = item.id || generateId();
  const ref = doc(db, collectionName, id);
  await setDoc(ref, { ...item, id } as any, { merge: true });
  return id;
}

export async function update<T>(collectionName: string, id: string, patch: Partial<T>): Promise<void> {
  const ref = doc(db, collectionName, id);
  await updateDoc(ref, patch as any);
}

export async function remove(collectionName: string, id: string): Promise<void> {
  const ref = doc(db, collectionName, id);
  await deleteDoc(ref);
}

export async function getAll<T>(collectionName: string): Promise<T[]> {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

// ============================================================
// DOMAIN-SPECIFIC GETTERS (Fully Typed)
// ============================================================
export async function getOpportunities(): Promise<Opportunity[]> { return getAll<Opportunity>("opportunities"); }
export async function getCurated(): Promise<CuratedOpportunity[]> { return getAll<CuratedOpportunity>("curated"); }
export async function getEvents(): Promise<GSICEvent[]> { return getAll<GSICEvent>("events"); }
export async function getTests(): Promise<Test[]> { return getAll<Test>("tests"); }
export async function getRegistrations(): Promise<Registration[]> { return getAll<Registration>("registrations"); }
export async function getTestResults(): Promise<TestResult[]> { return getAll<TestResult>("testResults"); }
export async function getDocuments(): Promise<Document[]> { return getAll<Document>("documents"); }
export async function getAdminAccounts(): Promise<AdminAccount[]> { return getAll<AdminAccount>("adminAccounts"); }

// ============================================================
// USER PROFILE HELPERS
// ============================================================
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  const ref = doc(db, "users", uid);
  await setDoc(ref, profile as any, { merge: true });
}

// ============================================================
// SMART SEEDER
// ============================================================
export async function ensureSeed<T extends { id: string }>(collectionName: string, seedItems: T[]): Promise<void> {
  const snap = await getDocs(collection(db, collectionName));
  if (snap.empty) {
    const writes = seedItems.map((item) => setDoc(doc(db, collectionName, item.id), item as any));
    await Promise.all(writes);
    console.log(`✅ Seeded ${collectionName}`);
  }
}