// ============================================================
// Per-type configuration + "Quick Overview" builder (pure; no DB).
// ============================================================
import { formatDate, TYPE_LABEL } from "@/lib/opportunity-status";
import { readList, quickFact, type QuickFact } from "@/lib/validation/opportunity";

export type OppType = "scholarship" | "competition" | "research" | "career";
export const OPP_TYPE_ORDER: OppType[] = ["scholarship", "competition", "research", "career"];

export interface TypeConfig {
  label: string;
  plural: string;
  blurb: string;
  /** Headings used on the detail page (vary by type so copy reads naturally). */
  headings: { about: string; eligibility: string; benefits: string; apply: string };
  applyCta: string;
  /** Suggested "Additional information" rows & checklists the admin editor can pre-fill. */
  presetFacts: string[];
  presetDocs: string[];
  presetSteps: { title: string; description: string }[];
}

export const TYPE_CONFIG: Record<OppType, TypeConfig> = {
  scholarship: {
    label: "Scholarship", plural: "Scholarships", blurb: "Funding for tuition and living costs, in Indonesia and abroad.",
    headings: { about: "About the scholarship", eligibility: "Who can apply", benefits: "What it covers", apply: "How to apply" },
    applyCta: "Apply for scholarship",
    presetFacts: ["Minimum GPA", "Living cost coverage", "Service obligation", "Destination institution"],
    presetDocs: ["ID card / student card", "Transcript", "Recommendation letter", "Motivation essay", "CV"],
    presetSteps: [
      { title: "Prepare documents", description: "Scan the required documents as PDF files." },
      { title: "Create an account on the organizer's portal", description: "Use an email address you check regularly." },
      { title: "Complete the form and upload files", description: "Check your entries before you submit." },
      { title: "Submit before the deadline", description: "Keep the confirmation or registration number." },
      { title: "Go through the selection stages", description: "Watch for announcements by email and on official channels." },
    ],
  },
  competition: {
    label: "Competition", plural: "Competitions", blurb: "Writing, innovation, business and technology competitions, national and international.",
    headings: { about: "About the competition", eligibility: "Who can enter", benefits: "Prizes and awards", apply: "How to enter" },
    applyCta: "Register for competition",
    presetFacts: ["Team size", "Total prize", "Competition category", "Registration fee", "Round format"],
    presetDocs: ["Proposal / abstract", "Team details", "Active student certificate", "Proof of payment"],
    presetSteps: [
      { title: "Form a team", description: "Make sure the team meets the rules." },
      { title: "Register the team", description: "Use the official link." },
      { title: "Submit your work or proposal", description: "Follow the format guide and submission deadline." },
      { title: "Take part in selection rounds and the final", description: "Prepare a presentation and demo." },
    ],
  },
  research: {
    label: "Research Grant", plural: "Research Grant", blurb: "Research grants, early-career researcher programs and lab collaborations.",
    headings: { about: "About the research program", eligibility: "Who can apply", benefits: "Support and funding", apply: "How to apply" },
    applyCta: "Submit proposal",
    presetFacts: ["Research field", "Funding scheme", "Max. funding per project", "Required outputs", "Host institution"],
    presetDocs: ["Research proposal", "Researcher CV", "Budget plan", "Supervisor support letter"],
    presetSteps: [
      { title: "Choose a scheme and topic", description: "Check that the topic fits the organizer's research priorities." },
      { title: "Write the proposal and budget", description: "Use the official template and respect the page limit." },
      { title: "Get supervisor or institution approval", description: "" },
      { title: "Upload the proposal", description: "Submit through the official system before the deadline." },
      { title: "Review and interview", description: "Prepare to present your proposal." },
    ],
  },
  career: {
    label: "Career", plural: "Careers and internships", blurb: "Internships, trainee programs, fellowships and jobs for students and fresh graduates.",
    headings: { about: "About the role", eligibility: "Qualifications", benefits: "Compensation and benefits", apply: "How to apply" },
    applyCta: "Apply now",
    presetFacts: ["Job type", "Salary / stipend range", "Work arrangement", "Contract length", "Experience level"],
    presetDocs: ["CV", "Portfolio", "Transcript", "Cover letter"],
    presetSteps: [
      { title: "Update your CV and portfolio", description: "Tailor them to the job description." },
      { title: "Send your application", description: "Use the company's official link." },
      { title: "Tests and assessment", description: "Usually an online test or a case study." },
      { title: "Interview", description: "HR and hiring manager interviews." },
      { title: "Offer", description: "" },
    ],
  },
};

export const isOppType = (t: string): t is OppType => t in TYPE_CONFIG;
export const typeLabel = (t: string) => (isOppType(t) ? TYPE_CONFIG[t].label : TYPE_LABEL[t] ?? t);

export const FUNDING_LABEL: Record<string, string> = {
  fully_funded: "Fully funded",
  partially_funded: "Partially funded",
  tuition_only: "Tuition only",
  stipend: "Stipend / allowance",
  prize_money: "Prize money",
  paid: "Paid",
  unpaid: "Unpaid",
  self_funded: "Self-funded",
};
export const FUNDING_SHORT: Record<string, string> = {
  fully_funded: "Fully funded", partially_funded: "Partial", tuition_only: "Tuition", stipend: "Stipend",
  prize_money: "Prize money", paid: "Paid", unpaid: "Unpaid", self_funded: "Self-funded",
};
export const MODE_LABEL: Record<string, string> = { onsite: "In person (onsite)", online: "Online", hybrid: "Hybrid" };
export const MODE_SHORT: Record<string, string> = { onsite: "Onsite", online: "Online", hybrid: "Hybrid" };

// ---------------------------------------------------------------- quick overview

export interface DetailSource {
  title: string;
  organizer: string;
  type: string;
  scope: string;
  levels: string[];
  fieldsOfStudy: string[];
  openDate: Date | string | null;
  deadline: Date | string;
  programStart: Date | string | null;
  programEnd: Date | string | null;
  quota: number | null;
  fundingType: string | null;
  fundingAmount: string | null;
  attendanceMode: string | null;
  city: string | null;
  country: string | null;
  location: string | null;
  ageMin: number | null;
  ageMax: number | null;
  nationality: string | null;
  minGpa: number | null;
  duration: string | null;
  language: string | null;
  quickFacts: unknown;
}

export interface Fact { label: string; value: string }
export interface FactGroup { title: string; facts: Fact[] }

const TZ = "Asia/Jakarta";

/** "9 Oct 2026" or "9 Oct 2026, 23:59 WIB" when a time of day was set. */
export function formatDateTimeId(d: Date | string): string {
  const date = new Date(d);
  const day = formatDate(date);
  const hm = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(date);
  return /^00:00$/.test(hm) ? day : `${day}, ${hm} WIB`;
}

export function formatAge(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `${min}–${max} years`;
  if (min != null) return `Minimum ${min} years`;
  if (max != null) return `Maximum ${max} years`;
  return null;
}

export function formatPlace(city: string | null, country: string | null, fallback?: string | null): string | null {
  const s = [city, country].filter(Boolean).join(", ");
  return s || fallback || null;
}

export function buildQuickOverview(o: DetailSource): FactGroup[] {
  const range = o.programStart ? `${formatDate(o.programStart)}${o.programEnd ? ` – ${formatDate(o.programEnd)}` : ""}` : null;
  const funding = [o.fundingType ? FUNDING_LABEL[o.fundingType] : null, o.fundingAmount].filter(Boolean).join(" · ");

  const groups: FactGroup[] = [
    {
      title: "Program information",
      facts: [
        { label: "Program name", value: o.title },
        { label: "Organizer", value: o.organizer },
        { label: "Type", value: typeLabel(o.type) },
        { label: "Category", value: o.scope === "internal" ? "Internal (ITB)" : "External" },
        { label: "Language", value: o.language ?? "" },
        { label: "Duration", value: o.duration ?? "" },
        { label: "Program dates", value: range ?? "" },
      ],
    },
    {
      title: "Location and format",
      facts: [
        { label: "Format", value: o.attendanceMode ? MODE_LABEL[o.attendanceMode] ?? "" : "" },
        { label: "City", value: o.city ?? "" },
        { label: "Country", value: o.country ?? "" },
        { label: "Location", value: !o.city && !o.country ? o.location ?? "" : "" },
      ],
    },
    {
      title: "Funding and quota",
      facts: [
        { label: "Funding type", value: funding },
        { label: "Places available", value: o.quota != null ? `${o.quota.toLocaleString("en-GB")}` : "" },
      ],
    },
    {
      title: "Basic requirements",
      facts: [
        { label: "Level", value: o.levels.join(", ") },
        { label: "Field of study", value: o.fieldsOfStudy.join(", ") },
        { label: "Age", value: formatAge(o.ageMin, o.ageMax) ?? "" },
        { label: "Nationality", value: o.nationality ?? "" },
        { label: "Minimum GPA", value: o.minGpa != null ? o.minGpa.toFixed(2) : "" },
      ],
    },
    {
      title: "Key dates",
      facts: [
        { label: "Applications open", value: o.openDate ? formatDateTimeId(o.openDate) : "" },
        { label: "Application deadline", value: formatDateTimeId(o.deadline) },
      ],
    },
  ];

  const extras: QuickFact[] = readList(quickFact, o.quickFacts);
  if (extras.length) groups.push({ title: "Additional information", facts: extras.map((f) => ({ label: f.label, value: f.value })) });

  return groups
    .map((g) => ({ ...g, facts: g.facts.filter((f) => f.value && f.value.trim()) }))
    .filter((g) => g.facts.length > 0);
}

/** Human-readable basic criteria derived from structured fields (shown first under "Criteria"). */
export function deriveBasicCriteria(o: Pick<DetailSource, "levels" | "fieldsOfStudy" | "ageMin" | "ageMax" | "nationality" | "minGpa">): string[] {
  const out: string[] = [];
  if (o.levels.length) out.push(`Students or graduates at level: ${o.levels.join(", ")}`);
  if (o.fieldsOfStudy.length) out.push(`Field of study: ${o.fieldsOfStudy.join(", ")}`);
  const age = formatAge(o.ageMin, o.ageMax);
  if (age) out.push(`Age: ${age.charAt(0).toLowerCase()}${age.slice(1)}`);
  if (o.nationality) out.push(`Nationality: ${o.nationality}`);
  if (o.minGpa != null) out.push(`Minimum GPA ${o.minGpa.toFixed(2)}`);
  return out;
}
