import { describe, expect, it } from "vitest";
import { accountSchema } from "@/lib/validation/auth";
import { applySchema, createCallSchema } from "@/lib/validation/teams";

describe("sign-up password confirmation", () => {
  it("rejects a mismatched repeat", () => {
    const r = accountSchema.safeParse({ name: "Ayu Lestari", email: "a@itb.ac.id", password: "Str0ngpass!", confirm: "Str0ngpass?" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path[0] === "confirm")).toBe(true);
  });
});

describe("partner posts", () => {
  const base = { title: "Need a modeler", competition: "BCC UI", rolesNeeded: ["Financial Modeler"], slots: 1, description: "We are building a case deck.", deadline: new Date(Date.now() + 7 * 864e5) };
  it("accepts free-text roles and skills", () => {
    const r = createCallSchema.safeParse({ ...base, skillsNeeded: ["Excel"], kind: "looking_for_team" });
    expect(r.success).toBe(true);
  });
  it("caps roles at four", () => {
    expect(createCallSchema.safeParse({ ...base, rolesNeeded: ["a1", "b2", "c3", "d4", "e5"] }).success).toBe(false);
  });
  it("responses need a role and a note", () => {
    expect(applySchema.safeParse({ role: "Analyst", message: "I did two BCCs last year." }).success).toBe(true);
    expect(applySchema.safeParse({ role: "", message: "short" }).success).toBe(false);
  });
});
