// ============================================================
// Google Sheets API v4 integration (service account)
//
// Reads credentials from environment variables:
//   GOOGLE_SHEETS_CLIENT_EMAIL  - service account email
//   GOOGLE_SHEETS_PRIVATE_KEY   - service account private key (PEM, may contain
//                                 the literal "\n" sequence in the env value)
//   GOOGLE_SHEETS_SPREADSHEET_ID - the target spreadsheet id
//
// The spreadsheet must be shared with the service account email.
// ============================================================

import { google } from "googleapis";

const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "";
const PRIVATE_KEY = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";

function assertConfigured(): void {
  if (!CLIENT_EMAIL || !PRIVATE_KEY || !SPREADSHEET_ID) {
    throw new Error(
      "Google Sheets is not configured. Set GOOGLE_SHEETS_CLIENT_EMAIL, " +
        "GOOGLE_SHEETS_PRIVATE_KEY and GOOGLE_SHEETS_SPREADSHEET_ID."
    );
  }
}

/** Column headers used by each synced worksheet. */
export const SHEET_SCHEMAS = {
  users: [
    "HTA ID",
    "Name",
    "Email",
    "Faculty",
    "Major",
    "Year",
    "WhatsApp",
    "Role",
    "Verified",
    "Registered At",
  ],
  registrations: [
    "User",
    "Email",
    "Event",
    "Status",
    "Pre-Test Done",
    "Post-Test Done",
    "Registered At",
  ],
  testResults: ["User", "Email", "Test", "Type", "Event", "Score", "Max", "Completed At"],
} as const;

export type SheetName = keyof typeof SHEET_SCHEMAS;

/** Row conversion helpers — each returns an array aligned to the schema above. */
export type SheetRow = (string | number | boolean)[];

let cachedAuth: InstanceType<typeof google.auth.JWT> | null = null;

/**
 * Returns (and lazily caches) an authenticated Sheets client using a JWT
 * credentials object. Refreshes automatically on 401 via the underlying lib.
 */
async function getSheetsClient() {
  assertConfigured();
  if (!cachedAuth) {
    cachedAuth = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  await cachedAuth.authorize();
  return google.sheets({ version: "v4", auth: cachedAuth });
}

/**
 * Clears a worksheet range starting at "A1" (or a provided start) so a full
 * re-sync reflects the current database state with no stale rows.
 */
async function clearRange(sheetName: string, rangeSpec: string): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: rangeSpec,
  });
}

/**
 * Writes a header + rows into the named sheet, clearing whatever was there.
 * `rows` are `SheetRow` arrays aligned to `SHEET_SCHEMAS[name]`.
 */
export async function writeSheet(name: SheetName, rows: SheetRow[]): Promise<{ written: number }> {
  const sheets = await getSheetsClient();
  const sheetTitle = resolveSheetTitle(name);
  const header = SHEET_SCHEMAS[name] as readonly string[];
  const range = `${sheetTitle}!A1`;
  const values = [header as string[], ...rows.map((r) => r.map(toCellValue))];

  // Clear the entire used range for this sheet before writing.
  await clearRange(sheetTitle, `${sheetTitle}!A1:ZZ2000`);

  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values },
  });

  return { written: res.data.updatedRange ? rows.length : 0 };
}

/**
 * Resolves a friendly sheet title. Defaults to the schema key capitalized;
 * overridable via `GOOGLE_SHEETS_SHEET_<NAME>` env (e.g. `_USERS`).
 */
function resolveSheetTitle(name: string): string {
  const key = `GOOGLE_SHEETS_SHEET_${name.toUpperCase()}`;
  const override = process.env[key];
  // First worksheet is often conveniently named "Sheet1"; use key name default.
  return override || name.charAt(0).toUpperCase() + name.slice(1);
}

function toCellValue(v: string | number | boolean): string {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

/** Combines the three primary sync targets into one drive-by function. */
export async function syncAll(
  datasets: { users: SheetRow[]; registrations: SheetRow[]; testResults: SheetRow[] }
): Promise<Record<SheetName, number>> {
  const [users, registrations, testResults] = await Promise.all([
    writeSheet("users", datasets.users),
    writeSheet("registrations", datasets.registrations),
    writeSheet("testResults", datasets.testResults),
  ]);
  return {
    users: users.written,
    registrations: registrations.written,
    testResults: testResults.written,
  };
}