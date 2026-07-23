import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function id(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// Generic helpers
export async function ensureSeed<T>(collectionName: string, seedItems: T[], idField = "id"): Promise<void> {
  const col = collection(db, collectionName);
  const snap = await getDocs(col);
  if (snap.empty) {
    const writes = seedItems.map((item) => {
      const anyItem = item as any;
      return setDoc(doc(col, anyItem[idField] || id()), { ...anyItem, createdAt: anyItem.createdAt || new Date().toISOString() });
    });
    await Promise.all(writes);
  }
}

export async function getAll<T>(collectionName: string): Promise<T[]> {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

export async function getById<T>(collectionName: string, key: string): Promise<T | null> {
  const ref = doc(db, collectionName, key);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as T) };
}

export async function create<T>(collectionName: string, item: T): Promise<string> {
  const key = id();
  const ref = doc(db, collectionName, key);
  await setDoc(ref, { ...(item as any), createdAt: new Date().toISOString() });
  return key;
}

export async function update<T>(collectionName: string, key: string, patch: Partial<T>): Promise<void> {
  const ref = doc(db, collectionName, key);
  await updateDoc(ref, patch as any);
}

export async function remove(collectionName: string, key: string): Promise<void> {
  const ref = doc(db, collectionName, key);
  await deleteDoc(ref);
}

// Convenience domain helpers
export async function getEvents() { return getAll("events"); }
export async function getTests() { return getAll("tests"); }
export async function getRegistrations() { return getAll("registrations"); }
export async function getTestResults() { return getAll("testResults"); }
export async function getOpportunities() { return getAll("opportunities"); }
export async function getDocuments() { return getAll("documents"); }
export async function getAdminAccounts() { return getAll("adminAccounts"); }