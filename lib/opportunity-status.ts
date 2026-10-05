// ============================================================
// Opportunity status + labels (pure, shared by server & client)
// ------------------------------------------------------------
// The displayed status is ALWAYS derived from the deadline, so an item flips
// to "Closed" the moment `deadline < now` with no admin action and no cron.
// ============================================================

export type DisplayStatus = "open" | "closing" | "closed" | "upcoming";

/** Items whose deadline is within this many days show "Closing soon". */
export const CLOSING_SOON_DAYS = 7;

const DAY_MS = 86_400_000;

export interface StatusInput {
  deadline: Date | string;
  openDate?: Date | string | null;
  /** Stored DB status; `archived` / `completed` force "closed". */
  status?: string | null;
}

export function getDisplayStatus(o: StatusInput, now: Date = new Date()): DisplayStatus {
  if (o.status === "archived" || o.status === "completed") return "closed";
  const deadline = new Date(o.deadline).getTime();
  if (Number.isNaN(deadline) || deadline < now.getTime()) return "closed";
  if (o.openDate && new Date(o.openDate).getTime() > now.getTime()) return "upcoming";
  if (deadline - now.getTime() <= CLOSING_SOON_DAYS * DAY_MS) return "closing";
  return "open";
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  open: "Open",
  closing: "Closing soon",
  closed: "Closed",
  upcoming: "Upcoming",
};

/** Whole days left until the deadline (0 = today, negative = passed). */
export function daysLeft(deadline: Date | string, now: Date = new Date()): number {
  return Math.ceil((new Date(deadline).getTime() - now.getTime()) / DAY_MS);
}

export const TYPE_LABEL: Record<string, string> = {
  scholarship: "Scholarship",
  competition: "Competition",
  research: "Research Grant",
  career: "Career",
};

export const LEVELS = ["D3", "D4", "S1", "S2", "S3", "PR"] as const;
export type Level = (typeof LEVELS)[number];

export const SCOPE_LABEL: Record<string, string> = {
  internal: "Internal",
  external: "External",
};

export const BENEFIT_CATEGORIES = [
  "Tuition",
  "Living costs",
  "Research funding",
  "Cash prize",
  "Personal development",
  "Internship",
  "Certificate",
] as const;

const ID_DATE: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" };
const ID_DATE_Y: Intl.DateTimeFormatOptions = { ...ID_DATE, year: "numeric" };

/** "23 Sep - 09 Oct 2026" (open date optional). */
export function formatPeriod(openDate: Date | string | null | undefined, deadline: Date | string): string {
  const end = new Date(deadline);
  const endStr = end.toLocaleDateString("en-GB", ID_DATE_Y);
  if (!openDate) return `Until ${endStr}`;
  const start = new Date(openDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = start.toLocaleDateString("en-GB", sameYear ? ID_DATE : ID_DATE_Y);
  return `${startStr} - ${endStr}`;
}

export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

/** @deprecated Use formatDate. */
export function formatDateId(d: Date | string): string {
  return formatDate(d);
}
