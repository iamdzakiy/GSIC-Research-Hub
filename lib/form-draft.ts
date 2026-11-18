// Pure helpers behind useFormDraft: kept apart so they can be tested without a browser.
import { z } from "zod";

export interface StoredDraft { data: Record<string, unknown>; step: number; savedAt: number }

/** A schema's `.partial()`. Wrapped schemas (superRefine) are unwrapped first, so cross-field rules never reject a half-filled form. */
export function partialOf(schema: z.ZodTypeAny): z.ZodTypeAny {
  let s: z.ZodTypeAny = schema;
  while (s instanceof z.ZodEffects) s = s.innerType();
  return s instanceof z.ZodObject ? s.partial() : s;
}

/**
 * Keeps the fields of a draft that pass the partial schema and drops the ones that do not.
 * Returns null when nothing usable is left. A draft is never treated as a submission.
 */
export function usableDraft(schema: z.ZodTypeAny, data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const partial = partialOf(schema);
  let current = { ...(data as Record<string, unknown>) };
  for (let i = 0; i < 6; i++) {
    const r = partial.safeParse(current);
    if (r.success) return Object.keys(r.data as object).length ? (r.data as Record<string, unknown>) : null;
    const bad = new Set(r.error.issues.map((x) => String(x.path[0] ?? "")).filter(Boolean));
    if (!bad.size) return null;
    for (const k of bad) delete current[k];
  }
  return null;
}

/** The newer of the device copy and the server copy. A tie goes to the server. */
export function pickNewer(local: StoredDraft | null, server: StoredDraft | null): StoredDraft | null {
  if (!local) return server;
  if (!server) return local;
  return local.savedAt > server.savedAt ? local : server;
}

export const draftStorageKey = (userId: string, formKey: string) => `gsic_draft_v1:${userId}:${formKey}`;

export function readLocal(store: Pick<Storage, "getItem">, userId: string, formKey: string): StoredDraft | null {
  try {
    const raw = store.getItem(draftStorageKey(userId, formKey));
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<StoredDraft>;
    if (!d || typeof d.savedAt !== "number" || !d.data || typeof d.data !== "object") return null;
    return { data: d.data as Record<string, unknown>, step: typeof d.step === "number" ? d.step : 1, savedAt: d.savedAt };
  } catch { return null; }
}

export function writeLocal(store: Pick<Storage, "setItem">, userId: string, formKey: string, d: StoredDraft): boolean {
  try { store.setItem(draftStorageKey(userId, formKey), JSON.stringify(d)); return true; } catch { return false; }
}

/** "Saved yesterday", "Saved 3 hours ago". */
export function savedAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return "saved just now";
  const m = Math.round(s / 60); if (m < 60) return `saved ${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60); if (h < 24) return `saved ${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24); return d === 1 ? "saved yesterday" : `saved ${d} days ago`;
}
