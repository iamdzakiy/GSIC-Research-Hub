import { describe, expect, it } from "vitest";
import { buildBroadcast, buildCaption, buildUpsertSql, captionLang, draftToPayload, hubUrl, type OpportunityDraft } from "@/lib/opportunity-broadcast";
import { opportunityInput } from "@/lib/validation/opportunity";

const draft: OpportunityDraft = {
  type: "competition", category: "bpc", lang: "id", emoji: "🏆",
  title: "Indonesia Entrepreneur Festival (IEF) 2026 — National BMC Competition", organizer: "Pusat Bisnis Nasional",
  intro: "Punya ide bisnis brilian? **IEF 2026** dibuka untuk pelajar dan mahasiswa.", summary: "",
  details: ["Format: 100% online", "**Batas Pendaftaran: 30 November 2026**"], benefits: ["Total hadiah jutaan rupiah"],
  eligibility: [{ text: "Pelajar SMA/SMK atau mahasiswa D3/D4/S1", required: true }], requiredDocuments: ["BMC 1–7 slide PDF"],
  howToApply: "Isi formulir pendaftaran. Kumpulkan BMC sebelum **30 November 2026**.", contact: "+62 888-1869-180",
  hashtags: ["LombaBMC", "#GSICHub"], link: "https://s.id/IEF-Pendaftaran", guidebookUrl: "https://s.id/IEF-Guidebook",
  deadline: "2026-11-30", openDate: "", submissionDeadline: "", programStart: "", programEnd: "",
  levels: ["S1"], benefitCategories: ["Cash prize"], fundingType: "prize_money", fundingAmount: "", attendanceMode: "online",
  city: "", country: "Indonesia", location: "", nationality: "", duration: "", ageMin: "", ageMax: "", minGpa: "", quota: "",
  teamSizeMin: "1", teamSizeMax: "3", registrationFee: "Rp100.000", theme: "Akselerasi Ide Bisnis", fieldsOfStudy: [], tags: ["bisnis"],
  quickFacts: [{ label: "Kategori", value: "Mahasiswa & Umum" }], timeline: [{ phase: "Pendaftaran", date: "s.d. 30 Nov 2026", description: "" }], warnings: [],
};

describe("BC caption", () => {
  it("uses the Indonesian section labels, hashtags and disclaimer", () => {
    const c = buildCaption(draft);
    expect(c.startsWith("🏆 **Indonesia Entrepreneur Festival")).toBe(true);
    expect(c).toContain("📌 **Detail Program**\n• Format: 100% online");
    expect(c).toContain("📲 **Contact Person**: +62 888-1869-180");
    expect(c).toContain("#LombaBMC #GSICHub");
    expect(captionLang(c)).toBe("id");
    expect(captionLang(buildCaption({ ...draft, lang: "en" }))).toBe("en");
  });
  it("adds the Hub link before the disclaimer", () => {
    const bc = buildBroadcast(buildCaption(draft), "id", hubUrl("https://gsic-research-hub.vercel.app/", "competition", "ief-2026"));
    expect(bc).toContain("🌐 Detail lengkap di GSIC Hub: https://gsic-research-hub.vercel.app/competitions/ief-2026\n\n*Disclaimer");
  });
});

describe("draft -> payload", () => {
  const p = draftToPayload(draft);
  it("passes the admin API validation", () => {
    expect(opportunityInput.safeParse(p).success).toBe(true);
  });
  it("reads a date-only deadline as 23:59 WIB", () => {
    expect(p.deadline).toBe("2026-11-30T16:59:00.000Z");
    expect(p.teamSizeMax).toBe(3);
    expect(p.category).toBe("bpc");
  });
  it("drops competition-only fields for other types", () => {
    expect("category" in draftToPayload({ ...draft, type: "scholarship" })).toBe(false);
  });
});

describe("Supabase SQL", () => {
  it("builds a re-runnable upsert with every column", () => {
    const sql = buildUpsertSql(draftToPayload(draft), { slug: "ief-2026" });
    expect(sql).toContain('INSERT INTO "Opportunity" ("id","type","title","slug"');
    expect(sql).toContain("$q$bc-ief-2026$q$");
    expect(sql).toContain("'2026-11-30T16:59:00.000'::timestamp");
    expect(sql).toContain("ARRAY[$q$S1$q$]::text[]");
    expect(sql).toContain('ON CONFLICT ("slug") DO UPDATE SET');
    expect(sql).not.toContain('"slug" = EXCLUDED');
  });
  it("picks a dollar-quote tag that is not in the text", () => {
    const sql = buildUpsertSql({ ...draftToPayload(draft), title: "Costs $q$ 5" }, { slug: "x" });
    expect(sql).toContain("$qq$Costs $q$ 5$qq$");
  });
});
