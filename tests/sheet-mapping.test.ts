import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("googleapis", () => ({ google: {} }));

const { blankCells, cellToInterests, interestsToCell, userCells } = await import("@/lib/matchmaking-sheet");
const { INTEREST_IDS } = await import("@/lib/profile-options");

const user = {
  email: "a@itb.ac.id", name: "Ayu", preferredRole: null, pkmRole: null, interests: INTEREST_IDS.slice(0, 3), fields: [], major: "Teknik Industri",
  majorCode: null, institution: "ITB", faculty: null, linkedinUrl: "https://www.linkedin.com/in/ayu", whatsapp: "0812", skills: ["Excel"], softSkills: [],
  cvPath: null, updatedAt: new Date("2027-01-01T00:00:00Z"), headline: "BCC analyst", competitionInterests: ["bcc", "hackathon"], openToTeam: true,
  portfolioUrl: null, githubUrl: "https://github.com/ayu", username: "ayu",
};

describe("matching sheet mapping", () => {
  it("round-trips research interests through the cell text", () => {
    const ids = INTEREST_IDS.slice(0, 4);
    expect(cellToInterests(interestsToCell(ids)).sort()).toEqual([...ids].sort());
  });
  it("writes the v2 columns", () => {
    const c = userCells(user);
    expect(c["Headline"]).toBe("BCC analyst");
    expect(c["Open to Team"]).toBe("Yes");
    expect(c["GitHub"]).toBe("https://github.com/ayu");
    expect(c["Competition Interests"]).toContain("Hackathon");
  });
  it("blanks every column it writes", () => {
    const b = blankCells();
    expect(Object.keys(b).sort()).toEqual(Object.keys(userCells(user)).sort());
    expect(Object.values(b).every((v) => v === "")).toBe(true);
  });
});
