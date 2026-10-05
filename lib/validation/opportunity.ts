// Zod schemas for the JSON-typed opportunity columns + the admin write payload.
import { z } from "zod";

export const OPP_TYPES = ["scholarship", "competition", "research", "career"] as const;
export const FUNDING_TYPES = ["fully_funded", "partially_funded", "tuition_only", "stipend", "prize_money", "paid", "unpaid", "self_funded"] as const;
export const ATTENDANCE_MODES = ["onsite", "online", "hybrid"] as const;

export const eligibilityItem = z.object({ text: z.string().trim().min(1).max(400), required: z.boolean().optional() });
export const applyStep = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(800).optional() });
export const selectionStage = z.object({ stage: z.string().trim().min(1).max(160), description: z.string().trim().max(800).optional(), date: z.string().trim().max(80).optional() });
export const faqItem = z.object({ q: z.string().trim().min(1).max(300), a: z.string().trim().min(1).max(2000) });
export const quickFact = z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(300) });
export const socialLink = z.object({ label: z.string().trim().min(1).max(60), url: z.string().trim().url().max(500) });
export const timelineItem = z.object({ phase: z.string().trim().min(1).max(160), date: z.string().trim().max(80).default(""), description: z.string().trim().max(800).default("") });

export type EligibilityItem = z.infer<typeof eligibilityItem>;
export type ApplyStep = z.infer<typeof applyStep>;
export type SelectionStage = z.infer<typeof selectionStage>;
export type FaqItem = z.infer<typeof faqItem>;
export type QuickFact = z.infer<typeof quickFact>;
export type SocialLink = z.infer<typeof socialLink>;
export type TimelineItem = z.infer<typeof timelineItem>;

/** Lenient reader for JSON columns: drops malformed rows instead of throwing. */
export function readList<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const v of value) {
    const r = schema.safeParse(v);
    if (r.success) out.push(r.data);
  }
  return out;
}

const optStr = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));
const optInt = z.number().int().min(0).max(1_000_000).optional().nullable();
const optDate = z.string().trim().optional().nullable().transform((v, ctx) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) { ctx.addIssue({ code: "custom", message: "Tanggal tidak valid" }); return z.NEVER; }
  return d;
});
const strList = (maxItems: number, maxLen = 120) => z.array(z.string().trim().min(1).max(maxLen)).max(maxItems).optional();

/** Admin create/update payload. Everything beyond the core fields is optional. */
export const opportunityInput = z.object({
  type: z.enum(OPP_TYPES),
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().max(120).optional(),
  organizer: z.string().trim().min(2).max(160),
  summary: optStr(600),
  description: z.string().max(40_000).default(""),
  deadline: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), "Deadline tidak valid"),
  openDate: optDate,
  status: z.enum(["active", "archived", "upcoming", "ongoing", "completed"]).optional(),
  isAnnual: z.boolean().optional(),
  scope: z.enum(["internal", "external"]).optional(),
  levels: strList(8, 10),
  benefitCategories: strList(10, 60),
  benefits: strList(20, 120),
  requiredSkills: strList(30, 60),
  fieldsOfStudy: strList(30, 80),
  tags: strList(20, 40),
  requiredDocuments: strList(30, 160),
  quota: optInt,
  fundingType: z.enum(FUNDING_TYPES).optional().nullable(),
  fundingAmount: optStr(160),
  attendanceMode: z.enum(ATTENDANCE_MODES).optional().nullable(),
  city: optStr(80),
  country: optStr(80),
  ageMin: optInt,
  ageMax: optInt,
  nationality: optStr(120),
  minGpa: z.number().min(0).max(4).optional().nullable(),
  duration: optStr(80),
  programStart: optDate,
  programEnd: optDate,
  language: optStr(60),
  link: z.string().trim().url().max(600).optional().nullable().or(z.literal("")),
  posterUrl: z.string().trim().max(600).optional().nullable(),
  cpName: optStr(120),
  cpContact: optStr(120),
  contactEmail: z.string().trim().email().max(200).optional().nullable().or(z.literal("")),
  location: optStr(160),
  programBenefits: optStr(20_000),
  eligibility: optStr(20_000),
  howToApply: optStr(20_000),
  tips: optStr(20_000),
  eligibilityCriteria: z.array(eligibilityItem).max(40).optional(),
  applySteps: z.array(applyStep).max(20).optional(),
  selectionStages: z.array(selectionStage).max(20).optional(),
  faqs: z.array(faqItem).max(30).optional(),
  quickFacts: z.array(quickFact).max(30).optional(),
  socialLinks: z.array(socialLink).max(10).optional(),
  timeline: z.array(timelineItem).max(30).optional(),
});
export type OpportunityInput = z.infer<typeof opportunityInput>;

export const LINK_CATEGORIES = [
  "Beasiswa", "Kompetisi", "Riset & Jurnal", "Karier & Magang", "Tools & Template", "Kampus ITB", "Belajar & Kursus", "Komunitas", "Lainnya",
] as const;

export const linkInput = z.object({
  title: z.string().trim().min(2).max(160),
  url: z.string().trim().url().max(600).refine((u) => /^https?:\/\//i.test(u), "Hanya http/https"),
  description: optStr(500),
  category: z.string().trim().min(2).max(60),
  tags: strList(8, 30),
  isFeatured: z.boolean().optional(),
  order: z.number().int().min(0).max(10_000).optional(),
  status: z.enum(["published", "hidden"]).optional(),
});
export type LinkInput = z.infer<typeof linkInput>;
