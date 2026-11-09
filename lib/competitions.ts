// Competition categories, per-category partner roles, and WIB date helpers. Pure, safe on client and server.
import { PREFERRED_ROLES } from "@/lib/profile-options";

/** Category ids are stored as strings (not a Prisma enum) so a new one needs no migration. */
export const COMPETITION_CATEGORIES = [
  { id: "bcc", label: "Business Case Competition (BCC)", short: "BCC" },
  { id: "bpc", label: "Business Plan Competition (BPC)", short: "BPC" },
  { id: "case", label: "Case Competition", short: "Case" },
  { id: "hackathon", label: "Hackathon", short: "Hackathon" },
  { id: "paper", label: "Scientific Paper / LKTI", short: "LKTI" },
  { id: "essay", label: "Essay", short: "Essay" },
  { id: "uiux", label: "UI/UX", short: "UI/UX" },
  { id: "data", label: "Data Science", short: "Data" },
  { id: "innovation", label: "Innovation / Startup", short: "Innovation" },
  { id: "design", label: "Design / Poster", short: "Design" },
  { id: "debate", label: "Debate / MUN", short: "Debate" },
  { id: "pkm", label: "PKM", short: "PKM" },
  { id: "other", label: "Other", short: "Other" },
] as const;
export type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number]["id"];
export const CATEGORY_IDS: readonly string[] = COMPETITION_CATEGORIES.map((c) => c.id);
export const isCategory = (v: unknown): v is CompetitionCategory => typeof v === "string" && CATEGORY_IDS.includes(v);
export const categoryShort = (id?: string | null) => COMPETITION_CATEGORIES.find((c) => c.id === id)?.short ?? "";
export const categoryLabel = (id?: string | null) => COMPETITION_CATEGORIES.find((c) => c.id === id)?.label ?? "";

const PKM_ROLES = PREFERRED_ROLES.map((r) => r.label);
/** Suggested roles for a Seeking Partner post, by competition category. Free text is always allowed too. */
export const ROLE_SUGGESTIONS: Record<string, string[]> = {
  bcc: ["Analyst", "Strategist", "Financial Modeler", "Slide Designer", "Presenter"],
  case: ["Analyst", "Strategist", "Financial Modeler", "Slide Designer", "Presenter"],
  bpc: ["Hustler", "Product", "Finance", "Pitcher"],
  innovation: ["Hustler", "Product", "Finance", "Pitcher"],
  hackathon: ["Backend", "Frontend", "Mobile", "UI/UX", "ML", "Pitcher"],
  uiux: ["UI/UX", "Researcher", "Frontend", "Presenter"],
  data: ["Data Analyst", "ML", "Data Engineer", "Presenter"],
  paper: ["Researcher", "Writer", "Data Analyst"],
  essay: ["Researcher", "Writer"],
  design: ["Designer", "Illustrator", "Writer"],
  debate: ["Speaker", "Researcher"],
  pkm: PKM_ROLES,
  other: ["Researcher", "Designer", "Developer", "Presenter"],
};
export const rolesFor = (category?: string | null) => ROLE_SUGGESTIONS[category ?? ""] ?? ROLE_SUGGESTIONS.other!;

// ---------- WIB (UTC+7, no DST) ----------
const WIB_MS = 7 * 3600_000;
/** "2026-11-14" (a date with no time) -> 23:59 WIB that day. A full ISO string is kept as is. */
export function wibEndOfDay(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1, 23, 59) - WIB_MS);
}
export const parseDeadline = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? wibEndOfDay(v) : new Date(v));

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", ...opts });
export const wibDate = (d: Date | string) => fmt({ weekday: "short", day: "numeric", month: "short" }).format(new Date(d));
export const wibDateLong = (d: Date | string) => fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
export const wibTime = (d: Date | string) => fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(d)).replace(":", ".");

/** "Closes in 5 days · Fri 14 Nov, 23.59 WIB" and an urgency flag (< 72 h). */
export function closesLabel(deadline: Date | string, now = new Date()): { text: string; urgent: boolean; closed: boolean } {
  const d = new Date(deadline);
  const ms = d.getTime() - now.getTime();
  const when = `${wibDate(d)}, ${wibTime(d)} WIB`;
  if (ms <= 0) return { text: `Closed · ${when}`, urgent: false, closed: true };
  const h = Math.floor(ms / 3600_000);
  const rel = h < 1 ? "Closes within the hour" : h < 24 ? `Closes in ${h} h` : `Closes in ${Math.ceil(h / 24)} day${Math.ceil(h / 24) === 1 ? "" : "s"}`;
  return { text: `${rel} · ${when}`, urgent: ms < 72 * 3600_000, closed: false };
}
