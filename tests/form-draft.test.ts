import { describe, expect, it } from "vitest";
import { z } from "zod";
import { partialOf, pickNewer, readLocal, savedAgo, usableDraft, writeLocal } from "@/lib/form-draft";

const schema = z.object({ scheme: z.enum(["A", "B"]), hope: z.string().max(5) }).superRefine((d, ctx) => { if (d.hope === "x") ctx.addIssue({ code: "custom", path: ["hope"], message: "no" }); });

describe("form draft helpers", () => {
  it("unwraps refined schemas and makes every field optional", () => {
    expect(partialOf(schema).safeParse({}).success).toBe(true);
  });
  it("keeps valid fields and drops invalid ones", () => {
    expect(usableDraft(schema, { scheme: "A", hope: "too long for this" })).toEqual({ scheme: "A" });
    expect(usableDraft(schema, { scheme: "Z", hope: "ok" })).toEqual({ hope: "ok" });
  });
  it("returns null when nothing is usable", () => {
    expect(usableDraft(schema, { scheme: "Z" })).toBeNull();
    expect(usableDraft(schema, null)).toBeNull();
    expect(usableDraft(schema, [])).toBeNull();
  });
  it("picks the newer copy and prefers the server on a tie", () => {
    const a = { data: { a: 1 }, step: 1, savedAt: 10 }, b = { data: { b: 1 }, step: 2, savedAt: 20 };
    expect(pickNewer(a, b)).toBe(b);
    expect(pickNewer(b, a)).toBe(b);
    expect(pickNewer(a, { ...a })).not.toBe(a);
    expect(pickNewer(null, a)).toBe(a);
    expect(pickNewer(a, null)).toBe(a);
    expect(pickNewer(null, null)).toBeNull();
  });
  it("round-trips through storage and ignores broken values", () => {
    const m = new Map<string, string>();
    const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    expect(writeLocal(store, "u", "f", { data: { a: 1 }, step: 2, savedAt: 5 })).toBe(true);
    expect(readLocal(store, "u", "f")).toEqual({ data: { a: 1 }, step: 2, savedAt: 5 });
    m.set("gsic_draft_v1:u:g", "{oops");
    expect(readLocal(store, "u", "g")).toBeNull();
  });
  it("words the age", () => {
    const now = 1_000_000_000;
    expect(savedAgo(now - 30_000, now)).toBe("saved just now");
    expect(savedAgo(now - 3 * 3600_000, now)).toBe("saved 3 hours ago");
    expect(savedAgo(now - 26 * 3600_000, now)).toBe("saved yesterday");
    expect(savedAgo(now - 4 * 86400_000, now)).toBe("saved 4 days ago");
  });
});
