import { describe, expect, it } from "vitest";
import { DRAFT_TTL_MS, SIGNUP_DRAFT_KEY, ago, loadDraft, sanitize, saveDraft } from "@/lib/signup-draft";
import { EMPTY_PROFILE } from "@/components/portal/ProfileFields";

const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), raw: m }; };

describe("signup draft", () => {
  it("never stores a password, even if one is passed in", () => {
    const store = mem();
    const input = { step: 2, name: "Ayu", email: "a@itb.ac.id", profile: EMPTY_PROFILE, password: "Secret123", confirm: "Secret123" } as never;
    expect(saveDraft(store, sanitize(input))).toBe(true);
    const raw = store.raw.get(SIGNUP_DRAFT_KEY)!;
    expect(raw).not.toMatch(/Secret123|password|confirm/i);
    expect(loadDraft(store)?.step).toBe(2);
  });
  it("expires after 14 days", () => {
    const store = mem();
    saveDraft(store, sanitize({ step: 1, name: "A", email: "", profile: EMPTY_PROFILE }, 1_000));
    expect(loadDraft(store, 1_000 + DRAFT_TTL_MS - 1)).not.toBeNull();
    expect(loadDraft(store, 1_000 + DRAFT_TTL_MS + 1)).toBeNull();
    expect(store.raw.has(SIGNUP_DRAFT_KEY)).toBe(false);
  });
  it("ignores corrupt data", () => {
    const store = mem(); store.setItem(SIGNUP_DRAFT_KEY, "{nope");
    expect(loadDraft(store)).toBeNull();
  });
  it("describes age in plain words", () => {
    const now = 10 * 864e5;
    expect(ago(now - 2 * 864e5, now)).toBe("2 days ago");
    expect(ago(now - 30_000, now)).toBe("just now");
    expect(ago(now - 3 * 3600e3, now)).toBe("3 hours ago");
  });
});
