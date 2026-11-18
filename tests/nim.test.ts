import { describe, expect, it } from "vitest";
import { detectedLabel, nimError, normalizeNim, parseNim, storedNim, validateStudentId } from "@/lib/nim";

const NOW = new Date("2026-11-17T00:00:00Z");

describe("parseNim", () => {
  it("reads program code, intake year and major from an ITB NIM", () => {
    const r = parseNim("10423001", NOW);
    expect(r).toMatchObject({ valid: true, programCode: "104", intakeYear: 2023, major: "Microbiology", faculty: "SITH" });
    expect(detectedLabel(r)).toBe("Detected: Microbiology, SITH · 2023");
  });
  it("treats an unknown program code as valid with no faculty", () => {
    const r = parseNim("16525012", NOW);
    expect(r.valid).toBe(true);
    expect(r.faculty).toBeUndefined();
    expect(detectedLabel(r)).toBeNull();
  });
  it("strips spaces and dots when pasted", () => {
    expect(normalizeNim("135 23.001")).toBe("13523001");
    expect(parseNim("135.23.001", NOW).major).toBe("Informatics/Computer Science");
  });
  it("rejects wrong length and non digits", () => {
    expect(parseNim("1352300", NOW).valid).toBe(false);
    expect(parseNim("135230011", NOW).valid).toBe(false);
    expect(parseNim("1352300a", NOW).error).toMatch(/digits/);
    expect(parseNim("", NOW).valid).toBe(false);
  });
  it("rejects an intake year in the future or more than 10 years back", () => {
    expect(parseNim("13527001", NOW).error).toMatch(/future/);
    expect(parseNim("13514001", NOW).error).toMatch(/years ago/);
    expect(parseNim("13516001", NOW).valid).toBe(true);
    expect(parseNim("13526001", NOW).valid).toBe(true);
  });
});

describe("other institutions", () => {
  it("accepts 4 to 20 letters and digits", () => {
    expect(validateStudentId("ab12").valid).toBe(true);
    expect(validateStudentId("abc").valid).toBe(false);
    expect(validateStudentId("a".repeat(21)).valid).toBe(false);
    expect(validateStudentId("ab-12!").valid).toBe(false);
  });
  it("picks the rule by institution", () => {
    expect(nimError("ITB", "13523001", NOW)).toBeNull();
    expect(nimError("Universitas Padjadjaran", "A123456")).toBeNull();
    expect(nimError("ITB", "A123456", NOW)).not.toBeNull();
    expect(storedNim("Unpad", "a-123 456")).toBe("A123456");
  });
});
