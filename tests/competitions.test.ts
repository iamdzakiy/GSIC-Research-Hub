import { describe, expect, it } from "vitest";
import { closesLabel, isCategory, rolesFor, wibEndOfDay } from "@/lib/competitions";

describe("wibEndOfDay", () => {
  it("is 23:59 in Jakarta, which is 16:59 UTC", () => {
    expect(wibEndOfDay("2027-03-10").toISOString()).toBe("2027-03-10T16:59:00.000Z");
  });
});

describe("closesLabel", () => {
  const now = new Date("2027-03-01T00:00:00Z");
  it("marks past deadlines closed", () => {
    const r = closesLabel(new Date("2027-02-28T00:00:00Z"), now);
    expect(r.closed).toBe(true);
    expect(r.urgent).toBe(false);
  });
  it("is urgent under 72 hours and shows hours under a day", () => {
    const r = closesLabel(new Date(now.getTime() + 5 * 3600_000), now);
    expect(r.urgent).toBe(true);
    expect(r.text).toMatch(/^Closes in 5 h · .* WIB$/);
  });
  it("counts days beyond a day and is not urgent past 72 hours", () => {
    const r = closesLabel(new Date(now.getTime() + 10 * 86_400_000), now);
    expect(r.urgent).toBe(false);
    expect(r.text.startsWith("Closes in 10 days")).toBe(true);
  });
});

describe("categories", () => {
  it("validates ids and suggests roles", () => {
    expect(isCategory("bcc")).toBe(true);
    expect(isCategory("nope")).toBe(false);
    expect(rolesFor("hackathon").length).toBeGreaterThan(2);
    expect(rolesFor(undefined).length).toBeGreaterThan(0);
  });
});
