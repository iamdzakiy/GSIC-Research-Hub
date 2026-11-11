// Broadcast (BC) caption + Supabase SQL builders for opportunities. Pure: safe on client and server.
// The caption and SQL formats match the hand-made batch in the project's bc-opportunities/build.py,
// so rows added from the admin AI import look the same as the seeded ones.
import { parseDeadline } from "@/lib/competitions";

export type BcLang = "id" | "en";

/** What the AI import produces before it becomes an Opportunity payload. Every field is always present. */
export interface OpportunityDraft {
  type: "scholarship" | "competition" | "research" | "career";
  category: string; // COMPETITION_CATEGORIES id, "" when not a competition
  lang: BcLang;
  emoji: string;
  title: string;
  organizer: string;
  intro: string; // 1-2 short paragraphs, the BC hook
  summary: string; // one or two sentences for cards
  details: string[]; // BC "Program Details" bullets, including the deadline bullet
  benefits: string[];
  eligibility: { text: string; required: boolean }[];
  requiredDocuments: string[];
  howToApply: string;
  contact: string;
  hashtags: string[];
  link: string;
  guidebookUrl: string;
  deadline: string; // YYYY-MM-DD (23:59 WIB) or full ISO; "" when unknown
  openDate: string;
  submissionDeadline: string;
  programStart: string;
  programEnd: string;
  levels: string[];
  benefitCategories: string[];
  fundingType: string;
  fundingAmount: string;
  attendanceMode: string;
  city: string;
  country: string;
  location: string;
  nationality: string;
  duration: string;
  ageMin: string;
  ageMax: string;
  minGpa: string;
  quota: string;
  teamSizeMin: string;
  teamSizeMax: string;
  registrationFee: string;
  theme: string;
  fieldsOfStudy: string[];
  tags: string[];
  quickFacts: { label: string; value: string }[];
  timeline: { phase: string; date: string; description: string }[];
  warnings: string[]; // what the model could not confirm from the source
}

const LABELS: Record<BcLang, Record<string, string>> = {
  en: {
    det: "Program Details", ben: "Program Benefits", eli: "Eligibility Criteria", doc: "Required Documents", app: "How to Apply", more: "More info", cp: "Contact Person", hub: "Full details on GSIC Hub",
    disc: "Disclaimer: This post is for informational purposes only. Eligibility, benefits, and deadlines may change. Please verify all details on the official website before applying.",
    lang: "English",
  },
  id: {
    det: "Detail Program", ben: "Benefit", eli: "Kriteria Peserta", doc: "Dokumen yang Dibutuhkan", app: "Cara Mendaftar", more: "Info lengkap", cp: "Contact Person", hub: "Detail lengkap di GSIC Hub",
    disc: "Disclaimer: Informasi ini hanya untuk tujuan informatif. Syarat, benefit, dan tenggat dapat berubah. Pastikan kamu memeriksa detail terbaru di situs resmi penyelenggara sebelum mendaftar.",
    lang: "Indonesian",
  },
};

const stripMd = (s: string) => s.replace(/\*\*|\*/g, "");
const bullets = (xs: string[]) => xs.filter(Boolean).map((x) => `• ${x}`).join("\n");
const section = (icon: string, label: string, xs: string[]) => (xs.filter(Boolean).length ? `${icon} **${label}**\n${bullets(xs)}` : "");
const hashtag = (t: string) => "#" + t.replace(/^#/, "").replace(/[^\p{L}\p{N}_]/gu, "");

/** The caption, stored in Opportunity.description (rendered as Markdown on the Hub). */
export function buildCaption(d: OpportunityDraft): string {
  const t = LABELS[d.lang];
  const parts = [
    `${d.emoji || "📢"} **${d.title}**`,
    d.intro,
    section("📌", t.det, d.details),
    section("💰", t.ben, d.benefits),
    section("🎯", t.eli, d.eligibility.map((e) => e.text)),
    section("📄", t.doc, d.requiredDocuments),
    d.howToApply ? `🔗 **${t.app}**\n${d.howToApply}` : "",
    d.contact ? `📲 **${t.cp}**: ${d.contact}` : "",
    d.link ? `👉 ${t.more}: ${d.link}` : "",
    `*${t.disc}*`,
    d.hashtags.length ? d.hashtags.map(hashtag).join(" ") : "",
  ];
  return parts.filter((p) => p && p.trim()).join("\n\n");
}

export function hubUrl(site: string, type: string, slug: string): string {
  return `${site.replace(/\/$/, "")}/${type === "competition" ? "competitions" : "opportunities"}/${slug}`;
}

/** The group broadcast: the caption plus a line pointing at the Hub page, inserted before the disclaimer. */
export function buildBroadcast(caption: string, lang: BcLang, url: string): string {
  const line = `🌐 ${LABELS[lang].hub}: ${url}`;
  const i = caption.indexOf("\n\n*Disclaimer");
  return i >= 0 ? `${caption.slice(0, i)}\n\n${line}${caption.slice(i)}` : `${caption}\n\n${line}`;
}

/** Guess the caption language back from a saved description (used when editing an existing row). */
export const captionLang = (description: string): BcLang => (/\*\*(Detail Program|Kriteria Peserta|Cara Mendaftar)\*\*|Disclaimer: Informasi ini/.test(description) ? "id" : "en");

/* ------------------------------------------------------------ draft -> payload */
const int = (s: string) => { const n = parseInt(s.replace(/[^\d]/g, ""), 10); return Number.isFinite(n) ? n : null; };
const float = (s: string) => { const n = parseFloat(s.replace(",", ".")); return Number.isFinite(n) ? n : null; };
const iso = (s: string) => {
  if (!s.trim()) return null;
  const d = parseDeadline(s.trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const pick = <T extends string>(v: string, allowed: readonly T[]): T | null => ((allowed as readonly string[]).includes(v) ? (v as T) : null);
const steps = (txt: string) =>
  stripMd(txt).split(/(?<=[.!])\s+/).map((x) => x.trim()).filter((x) => x.length > 3).slice(0, 6).map((x) => ({ title: x.slice(0, 160), description: "" }));

/** Same column mapping as build.py's row(): the caption goes in description, lists go in their own columns. */
export function draftToPayload(d: OpportunityDraft) {
  const tl = d.timeline.filter((r) => r.phase.trim());
  const comp = d.type === "competition";
  return {
    type: d.type,
    title: d.title,
    organizer: d.organizer,
    summary: d.summary || stripMd(d.intro.split("\n\n")[0] ?? "").slice(0, 600),
    description: buildCaption(d),
    deadline: iso(d.deadline) ?? "",
    openDate: iso(d.openDate),
    status: "active",
    scope: "external",
    isAnnual: false,
    link: d.link,
    posterUrl: null,
    levels: d.levels,
    benefitCategories: d.benefitCategories,
    benefits: d.benefits.map(stripMd),
    requiredSkills: [] as string[],
    fieldsOfStudy: d.fieldsOfStudy,
    tags: d.tags.map((t) => t.replace(/^#/, "")),
    requiredDocuments: d.requiredDocuments,
    quota: int(d.quota),
    fundingType: pick(d.fundingType, ["fully_funded", "partially_funded", "tuition_only", "stipend", "prize_money", "paid", "unpaid", "self_funded"] as const),
    fundingAmount: d.fundingAmount,
    attendanceMode: pick(d.attendanceMode, ["onsite", "online", "hybrid"] as const),
    city: d.city, country: d.country, location: d.location, nationality: d.nationality, duration: d.duration,
    ageMin: int(d.ageMin), ageMax: int(d.ageMax), minGpa: float(d.minGpa),
    programStart: iso(d.programStart), programEnd: iso(d.programEnd),
    language: LABELS[d.lang].lang,
    programBenefits: d.benefits.map((x) => `- ${x}`).join("\n"),
    eligibility: d.eligibility.map((e) => `- ${e.text}`).join("\n"),
    howToApply: d.howToApply,
    eligibilityCriteria: d.eligibility.filter((e) => e.text.trim()),
    applySteps: steps(d.howToApply),
    timeline: tl,
    selectionStages: tl.map((r) => ({ stage: r.phase, description: r.description, date: r.date })),
    quickFacts: d.quickFacts.filter((q) => q.label.trim() && q.value.trim()),
    cpContact: d.contact,
    ...(comp
      ? {
          category: d.category || null, theme: d.theme, guidebookUrl: d.guidebookUrl, submissionDeadline: iso(d.submissionDeadline),
          teamSizeMin: int(d.teamSizeMin), teamSizeMax: int(d.teamSizeMax), registrationFee: d.registrationFee,
        }
      : {}),
    isPublished: true,
  };
}

/* ---------------------------------------------------------------------- SQL */
const COLS = [
  "id", "type", "title", "slug", "organizer", "description", "requiredSkills", "benefits", "deadline", "isAnnual", "link", "posterUrl", "status", "cpName", "cpContact", "location",
  "programBenefits", "eligibility", "howToApply", "timeline", "scope", "levels", "benefitCategories", "openDate", "quota", "summary", "fundingType", "fundingAmount", "attendanceMode", "city", "country",
  "ageMin", "ageMax", "nationality", "minGpa", "duration", "programStart", "programEnd", "language", "fieldsOfStudy", "tags", "requiredDocuments", "eligibilityCriteria", "applySteps", "selectionStages",
  "faqs", "quickFacts", "socialLinks", "tips", "contactEmail", "category", "theme", "guidebookUrl", "submissionDeadline", "teamSizeMin", "teamSizeMax", "registrationFee", "isPublished",
] as const;
const ARRAY_COLS = new Set(["requiredSkills", "benefits", "levels", "benefitCategories", "fieldsOfStudy", "tags", "requiredDocuments"]);
const JSON_COLS = new Set(["timeline", "eligibilityCriteria", "applySteps", "selectionStages", "faqs", "quickFacts", "socialLinks"]);
const DATE_COLS = new Set(["deadline", "openDate", "programStart", "programEnd", "submissionDeadline"]);

/** Dollar-quoted literal with a tag that never occurs in the value, so no escaping is needed. */
function lit(v: string): string {
  let tag = "q";
  while (v.includes(`$${tag}$`)) tag += "q";
  return `$${tag}$${v}$${tag}$`;
}
function sqlValue(col: string, v: unknown): string {
  if (ARRAY_COLS.has(col)) {
    const xs = Array.isArray(v) ? (v as unknown[]).map(String).filter(Boolean) : [];
    return xs.length ? `ARRAY[${xs.map(lit).join(",")}]::text[]` : "ARRAY[]::text[]";
  }
  if (JSON_COLS.has(col)) return Array.isArray(v) && v.length ? `${lit(JSON.stringify(v))}::jsonb` : "NULL";
  if (DATE_COLS.has(col)) {
    if (!v) return "NULL";
    const d = new Date(String(v));
    // Prisma DateTime columns are timestamp(3) without time zone holding UTC.
    return Number.isNaN(d.getTime()) ? "NULL" : `'${d.toISOString().replace("Z", "")}'::timestamp`;
  }
  if (v === null || v === undefined || v === "") return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  return lit(String(v));
}

/** Re-runnable upsert for the Supabase SQL editor (same shape as opportunities_bc_seed.sql). */
export function buildUpsertSql(payload: Record<string, unknown>, opts: { slug: string; id?: string }): string {
  const row: Record<string, unknown> = {
    requiredSkills: [], benefits: [], isAnnual: false, status: "active", scope: "external", isPublished: true,
    ...payload,
    id: opts.id || `bc-${opts.slug}`,
    slug: opts.slug,
    description: payload.description ?? "",
  };
  const cols = COLS.map((c) => `"${c}"`).join(",");
  const vals = COLS.map((c) => sqlValue(c, row[c])).join(",\n  ");
  const upd = COLS.filter((c) => c !== "id" && c !== "slug").map((c) => `"${c}" = EXCLUDED."${c}"`).join(",\n  ");
  return `-- [${row.type}] ${String(row.title ?? "").replace(/\n/g, " ")}\nINSERT INTO "Opportunity" (${cols})\nVALUES (\n  ${vals}\n)\nON CONFLICT ("slug") DO UPDATE SET\n  ${upd};\n`;
}
