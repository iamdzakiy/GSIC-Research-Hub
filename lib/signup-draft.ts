// Sign-up draft kept on this device only. Passwords are never part of it, not even hashed:
// the type below has no password field, and `sanitize` drops everything it does not know.
import type { ProfileValues } from "@/components/portal/ProfileFields";

export const SIGNUP_DRAFT_KEY = "gsic_signup_draft_v1";
export const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export interface SignupDraft {
  v: 1;
  savedAt: number;
  step: 1 | 2 | 3;
  name: string;
  email: string;
  profile: ProfileValues;
}

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Copies only the allowed fields, so a password (or anything else) can never slip into the stored value. */
export function sanitize(d: { step: number; name: string; email: string; profile: ProfileValues }, now = Date.now()): SignupDraft {
  const step = d.step === 2 || d.step === 3 ? d.step : 1;
  return { v: 1, savedAt: now, step, name: String(d.name ?? ""), email: String(d.email ?? ""), profile: { ...d.profile } };
}

export function loadDraft(store: Store, now = Date.now()): SignupDraft | null {
  try {
    const raw = store.getItem(SIGNUP_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<SignupDraft>;
    if (d.v !== 1 || typeof d.savedAt !== "number" || !d.profile) { store.removeItem(SIGNUP_DRAFT_KEY); return null; }
    if (now - d.savedAt > DRAFT_TTL_MS) { store.removeItem(SIGNUP_DRAFT_KEY); return null; }
    return sanitize({ step: d.step ?? 1, name: d.name ?? "", email: d.email ?? "", profile: d.profile }, d.savedAt);
  } catch { return null; }
}

/** Returns false when the browser would not store it (private mode, full disk), so the form can warn before leaving. */
export function saveDraft(store: Store, d: SignupDraft): boolean {
  try { store.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(d)); return true; } catch { return false; }
}
export function clearDraft(store: Store) { try { store.removeItem(SIGNUP_DRAFT_KEY); } catch { /* ignore */ } }

/** "just now", "5 minutes ago", "2 days ago". */
export function ago(savedAt: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - savedAt) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24); return `${d} day${d === 1 ? "" : "s"} ago`;
}
