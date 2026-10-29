// ============================================================
// Write-through / read for the "GSIC Connection Matching Team Database" sheet.
//   Tab "Database": headers on row 3, row 5 is the "Contoh" example, rows from 6 are free.
// Rules: headers are found by NAME; never reorder or rename existing columns; never touch rows
// the app did not create (matched by the Email column) or that are not empty; never use
// writeSheet() from lib/googleSheets.ts (it clears the whole tab).
// Env: MATCHMAKING_SHEET_ID (optional, defaults to the GSIC sheet), GOOGLE_SHEETS_CLIENT_EMAIL,
//      GOOGLE_SHEETS_PRIVATE_KEY. Without credentials every call is a quiet no-op.
// ============================================================
import "server-only";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { FIELDS, INTERESTS, PKM_ROLES, PKM_SCHEMES, PREFERRED_ROLES, labelOf } from "@/lib/profile-options";
import type { Candidate } from "@/lib/matchmaking";

const DEFAULT_SHEET_ID = "13pRyUeItGva-t-2cmJmQsydK5j1jo0NZQa6eoYoQG_s";
const TAB = "Database";
const HEADER_IDX = 2; // row 3
const FIRST_FREE_IDX = 5; // row 6; row 5 is the example
const OWN_HEADERS = ["Email", "WhatsApp", "Hard Skills", "Soft Skills", "CV", "Updated At"] as const;

export const sheetConfigured = () => !!(process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY);
const sheetId = () => process.env.MATCHMAKING_SHEET_ID || DEFAULT_SHEET_ID;

function client() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: (process.env.GOOGLE_SHEETS_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

const colLetter = (i: number) => { let s = ""; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

// ---------- value mapping (app <-> sheet) ----------
/** SITH majors 104/106 are "SITH-S" (Sains), the rest "SITH-R" (Rekayasa). Other faculties use the plain code. */
export function sheetFaculty(faculty?: string | null, majorCode?: string | null): string {
  if (!faculty) return "";
  if (faculty !== "SITH") return faculty;
  return majorCode === "104" || majorCode === "106" ? "SITH-S" : majorCode ? "SITH-R" : "SITH";
}
const facultyBase = (s: string) => s.split("-")[0]!.trim().toUpperCase();

/** ["pkm-re","pkm-ki","bcc"] -> "PKM - RE, KI, Business case competitions" */
export function interestsToCell(ids: string[]): string {
  const pkm = PKM_SCHEMES.filter((s) => ids.includes(s.id)).map((s) => s.code);
  const other = ids.filter((i) => !i.startsWith("pkm-")).map((i) => labelOf(INTERESTS, i));
  return [pkm.length ? `PKM - ${pkm.join(", ")}` : "", ...other].filter(Boolean).join(", ");
}
/** Inverse of interestsToCell; also reads hand-typed cells such as "PKM - RE, KI, GFT". */
export function cellToInterests(text: string): string[] {
  const out: string[] = [];
  for (const raw of list(text.replace(/^PKM\s*-\s*/i, "PKM - "))) {
    const tok = raw.replace(/^PKM\s*-\s*/i, "").trim();
    const scheme = PKM_SCHEMES.find((s) => s.code.toLowerCase() === tok.toLowerCase());
    const other = INTERESTS.find((i) => i.label.toLowerCase() === tok.toLowerCase());
    const id = scheme?.id ?? other?.id;
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}
function cellToRole(text: string): string | null {
  const t = norm(text);
  if (!t) return null;
  if (/lead|principal|\bpi\b/.test(t)) return "research-lead";
  if (/analy|method|data/.test(t)) return "methodology-analyst";
  if (/literat|content|writer/.test(t)) return "literature-content";
  if (/financ|project|manage|\bpm\b/.test(t)) return "finance-pm";
  return null;
}
function cellToPkmRole(text: string): string | null {
  const t = norm(text);
  return PKM_ROLES.find((r) => t.startsWith(r.id))?.id ?? null;
}
function cellToFields(text: string): string[] {
  const map: [RegExp, string][] = [[/scien/, "science"], [/engineer/, "engineering"], [/business/, "business"], [/social|humanit/, "social-humanities"], [/health/, "health"], [/art|design/, "art-design"], [/tech/, "technology"]];
  return Array.from(new Set(list(text).flatMap((f) => map.filter(([re]) => re.test(norm(f))).map(([, id]) => id))));
}

export interface SheetUser {
  email: string; name: string | null; preferredRole: string | null; pkmRole: string | null; interests: string[]; fields: string[];
  major: string | null; majorCode: string | null; institution: string; faculty: string | null; linkedinUrl: string | null;
  whatsapp: string | null; skills: string[]; softSkills: string[]; cvPath: string | null; updatedAt: Date;
}

function userCells(u: SheetUser): Record<string, string> {
  return {
    "Name": u.name ?? "",
    "Preferred Role": u.preferredRole ? labelOf(PREFERRED_ROLES, u.preferredRole) : "",
    "Role in PKM": u.pkmRole ? labelOf(PKM_ROLES, u.pkmRole) : "",
    "Research Interests": interestsToCell(u.interests),
    "Field": u.fields.map((f) => labelOf(FIELDS, f)).join(", "),
    "Major": u.major ?? "",
    "Institution": u.institution,
    "Faculty": sheetFaculty(u.faculty, u.majorCode),
    "LinkedIn": u.linkedinUrl ?? "",
    "Email": u.email,
    "WhatsApp": u.whatsapp ?? "",
    "Hard Skills": u.skills.join(", "),
    "Soft Skills": u.softSkills.join(", "),
    "CV": u.cvPath ? "Yes" : "",
    "Updated At": u.updatedAt.toISOString(),
  };
}

// ---------- sheet access ----------
interface Table { rows: string[][]; col: Map<string, number> }

async function load(): Promise<Table> {
  const res = await client().spreadsheets.values.get({ spreadsheetId: sheetId(), range: `${TAB}!A1:ZZ3000` });
  const rows = (res.data.values ?? []) as string[][];
  const col = new Map<string, number>();
  (rows[HEADER_IDX] ?? []).forEach((h, i) => { const k = norm(h); if (k && !col.has(k)) col.set(k, i); });
  return { rows, col };
}

/** Appends any missing own headers to the right of the last existing one. Returns the (possibly extended) table. */
async function ensureHeaders(t: Table): Promise<Table> {
  const missing = OWN_HEADERS.filter((h) => !t.col.has(norm(h)));
  if (!missing.length) return t;
  let next = Math.max(...t.col.values(), -1) + 1;
  const data = missing.map((h) => { t.col.set(norm(h), next); return { range: `${TAB}!${colLetter(next++)}${HEADER_IDX + 1}`, values: [[h]] }; });
  await client().spreadsheets.values.batchUpdate({ spreadsheetId: sheetId(), requestBody: { valueInputOption: "RAW", data } });
  return t;
}

let chain: Promise<unknown> = Promise.resolve();
const serial = <T>(fn: () => Promise<T>): Promise<T> => { const p = chain.then(fn, fn); chain = p.catch(() => undefined); return p; };

/** Upserts users into the sheet with one read and one write. Returns counts. */
export function upsertUsers(users: SheetUser[]): Promise<{ updated: number; added: number }> {
  return serial(async () => {
    const t = await ensureHeaders(await load());
    const emailCol = t.col.get("email")!, nameCol = t.col.get("name"), noCol = t.col.get("no");
    const byEmail = new Map<string, number>();
    const free: number[] = [];
    t.rows.forEach((r, i) => {
      if (i < FIRST_FREE_IDX) return;
      const e = norm(r[emailCol]);
      if (e) byEmail.set(e, i);
      else if (!norm(nameCol === undefined ? "" : r[nameCol]) && !r.some((c, ci) => ci !== noCol && norm(c))) free.push(i);
    });
    let nextIdx = Math.max(t.rows.length, FIRST_FREE_IDX);
    let nextNo = Math.max(0, ...t.rows.slice(FIRST_FREE_IDX).map((r) => Number(noCol === undefined ? 0 : r[noCol]) || 0)) + 1;
    const data: { range: string; values: string[][] }[] = [];
    let updated = 0, added = 0;

    for (const u of users) {
      const key = norm(u.email);
      let idx = byEmail.get(key);
      if (idx === undefined) {
        idx = free.shift();
        if (idx === undefined) {
          idx = nextIdx++;
          if (noCol !== undefined) data.push({ range: `${TAB}!${colLetter(noCol)}${idx + 1}`, values: [[String(nextNo++)]] });
        }
        byEmail.set(key, idx);
        added++;
      } else updated++;
      for (const [header, value] of Object.entries(userCells(u))) {
        const c = t.col.get(norm(header));
        if (c !== undefined) data.push({ range: `${TAB}!${colLetter(c)}${idx + 1}`, values: [[value]] });
      }
    }
    if (data.length) await client().spreadsheets.values.batchUpdate({ spreadsheetId: sheetId(), requestBody: { valueInputOption: "RAW", data } });
    return { updated, added };
  });
}

const USER_SELECT = { email: true, name: true, preferredRole: true, pkmRole: true, interests: true, fields: true, major: true, majorCode: true, institution: true, faculty: true, linkedinUrl: true, whatsapp: true, skills: true, softSkills: true, cvPath: true, updatedAt: true } as const;

/** Mirrors one profile to the sheet. Never throws: a sheet problem must not fail registration or a profile save. */
export async function syncProfileToSheet(userId: string): Promise<void> {
  if (!sheetConfigured()) return;
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
    if (!u) return;
    await Promise.race([upsertUsers([u]), new Promise((_, rej) => setTimeout(() => rej(new Error("timed out")), 8_000))]);
  } catch (e) {
    console.error("[matchmaking-sheet] sync failed (admin can re-sync):", (e as Error).message);
  }
}

/** Admin re-sync of every profile. Throws on failure so the admin sees the reason. */
export async function syncAllProfiles(): Promise<{ updated: number; added: number; total: number }> {
  if (!sheetConfigured()) throw new Error("Google Sheets credentials are not set (GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY).");
  const users = await prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: "asc" } });
  return { ...(await upsertUsers(users)), total: users.length };
}

/** Reads every person in the sheet (including rows typed by hand). Skips the example row and empty rows. */
export async function readSheetCandidates(): Promise<Candidate[]> {
  const { rows, col } = await load();
  const get = (r: string[], h: string) => { const c = col.get(norm(h)); return c === undefined ? "" : String(r[c] ?? "").trim(); };
  const out: Candidate[] = [];
  rows.forEach((r, i) => {
    if (i < FIRST_FREE_IDX) return;
    const name = get(r, "Name");
    if (!name) return;
    const email = get(r, "Email").toLowerCase();
    const linkedin = get(r, "LinkedIn") || null;
    out.push({
      key: email || linkedin?.toLowerCase() || `sheet-row-${i + 1}`,
      name,
      preferredRole: cellToRole(get(r, "Preferred Role")),
      pkmRole: cellToPkmRole(get(r, "Role in PKM")),
      interests: cellToInterests(get(r, "Research Interests")),
      fields: cellToFields(get(r, "Field")),
      major: get(r, "Major"),
      faculty: facultyBase(get(r, "Faculty")),
      institution: get(r, "Institution") || "ITB",
      linkedinUrl: linkedin,
      skills: list(get(r, "Hard Skills")),
      source: "sheet",
    });
  });
  return out;
}
