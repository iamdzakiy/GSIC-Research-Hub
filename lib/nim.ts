// NIM (student ID) rules in one pure module, shared by the forms and the API.
// ITB format: exactly 8 digits. Digits 1-3 program code, 4-5 intake year, 6-8 serial number.
import { FACULTY_MAJOR_MAP } from "@/lib/types";

/**
 * First-year (TPB) students and some programs carry codes that are not in FACULTY_MAJOR_MAP.
 * An admin fills this in when the codes are confirmed: { "<3-digit code>": { faculty: "FMIPA", label: "TPB FMIPA" } }.
 * It is intentionally empty. Do not guess codes.
 */
export const TPB_CODES: Record<string, { faculty: string; label: string }> = {};

export interface NimInfo {
  valid: boolean;
  programCode: string;
  intakeYear: number | null;
  major?: string;
  faculty?: string;
  /** Set when the program code is a known first-year (TPB) code. */
  tpb?: string;
  error?: string;
}

/** Strips spaces, dots and dashes: what people paste from a student card or an email. */
export const normalizeNim = (raw: string): string => raw.replace(/[\s.\-_]/g, "");

const MAX_YEARS_BACK = 10;

export function parseNim(raw: string, now: Date = new Date()): NimInfo {
  const nim = normalizeNim(raw);
  const empty: NimInfo = { valid: false, programCode: "", intakeYear: null };
  if (!nim) return { ...empty, error: "Enter your NIM" };
  if (!/^\d+$/.test(nim)) return { ...empty, error: "Use digits only" };
  if (nim.length !== 8) return { ...empty, programCode: nim.slice(0, 3), error: "An ITB NIM has exactly 8 digits" };

  const programCode = nim.slice(0, 3);
  const intakeYear = 2000 + Number(nim.slice(3, 5));
  const year = now.getFullYear();
  if (intakeYear > year) return { ...empty, programCode, intakeYear, error: "The intake year in this NIM is in the future" };
  if (intakeYear < year - MAX_YEARS_BACK) return { ...empty, programCode, intakeYear, error: `The intake year in this NIM is more than ${MAX_YEARS_BACK} years ago` };

  const out: NimInfo = { valid: true, programCode, intakeYear };
  for (const [faculty, majors] of Object.entries(FACULTY_MAJOR_MAP)) {
    const m = majors.find((x) => x.code === programCode);
    if (m) { out.faculty = faculty; out.major = m.name; return out; }
  }
  const tpb = TPB_CODES[programCode];
  if (tpb) { out.faculty = tpb.faculty; out.tpb = tpb.label; }
  return out;
}

/** Student ID for other institutions: free format, 4 to 20 letters and digits. */
export function validateStudentId(raw: string): { valid: boolean; error?: string } {
  const id = normalizeNim(raw);
  if (!id) return { valid: false, error: "Enter your student ID" };
  if (!/^[A-Za-z0-9]+$/.test(id)) return { valid: false, error: "Use letters and digits only" };
  if (id.length < 4 || id.length > 20) return { valid: false, error: "Use 4 to 20 letters and digits" };
  return { valid: true };
}

export const isItb = (institution?: string | null) => (institution ?? "ITB").trim().toUpperCase() === "ITB";
export const nimLabel = (institution?: string | null) => (isItb(institution) ? "NIM" : "Student ID");

/** The one validation entry point: returns an error message, or null when the value is fine. */
export function nimError(institution: string | undefined | null, raw: string, now?: Date): string | null {
  if (isItb(institution)) return parseNim(raw, now).error ?? null;
  return validateStudentId(raw).error ?? null;
}

/** What gets stored: digits for ITB, upper-case letters and digits elsewhere. */
export const storedNim = (institution: string | undefined | null, raw: string): string =>
  isItb(institution) ? normalizeNim(raw) : normalizeNim(raw).toUpperCase();

export const NIM_TAKEN = "This NIM is already registered. Sign in instead, or contact GSIC if this is a mistake.";

/** Chip text for a recognised program code, e.g. "Detected: Microbiology, SITH · 2023". */
export function detectedLabel(info: NimInfo): string | null {
  if (!info.valid || !info.faculty) return null;
  return `Detected: ${info.major ?? info.tpb}, ${info.faculty} · ${info.intakeYear}`;
}
export const UNKNOWN_CODE_HELP = "First-year or unlisted program code. Pick your faculty and major.";
