// "Sync to sheet": one tab per test, written through the outbox. It only ever touches tabs it created:
// every tab it writes is named "GSIC Results · <key>", and it refuses to write to any other tab name.
import "server-only";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { pct } from "@/lib/scoring";
import { answerText, questionsOf, type AnswerIn } from "@/lib/scoring";

export const RESULTS_TAB_PREFIX = "GSIC Results · ";
const configured = () => !!(process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY && process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
export const resultsSheetConfigured = configured;

const tabName = (key: string) => `${RESULTS_TAB_PREFIX}${key}`.slice(0, 95).replace(/[\[\]*?:\\/]/g, "-");
const cell = (v: unknown) => { const s = String(v ?? ""); return /^[=+\-@]/.test(s) ? `'${s}` : s; };

export async function syncResultsToSheet(eventId: string): Promise<{ tabs: number }> {
  if (!configured()) throw new Error("Google Sheets is not configured.");
  const auth = new google.auth.JWT({ email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL, key: (process.env.GOOGLE_SHEETS_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  await auth.authorize();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" });
  const have = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title ?? ""));

  const tests = await prisma.test.findMany({ where: { eventId }, orderBy: [{ episode: "asc" }, { key: "asc" }] });
  let tabs = 0;
  for (const t of tests) {
    const title = tabName(t.key ?? t.id);
    if (!title.startsWith(RESULTS_TAB_PREFIX)) continue; // never write to a tab we did not create
    if (!have.has(title)) await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title } } }] } });
    const qs = questionsOf(t);
    const rows = await prisma.testResult.findMany({ where: { testId: t.id }, include: { user: { select: { nim: true, name: true, faculty: true, major: true, year: true } } }, orderBy: { completedAt: "asc" } });
    const head = ["NIM", "Name", "Faculty", "Major", "Intake", "Submitted", "Seconds", ...(t.kind === "survey" ? [] : ["Score %"]), ...qs.map((q) => q.id)];
    const body = rows.map((r) => {
      const a = Array.isArray(r.answers) ? (r.answers as unknown as AnswerIn[]) : [];
      return [r.user.nim ?? "", r.user.name ?? "", r.user.faculty ?? "", r.user.major ?? "", r.user.year ?? "", r.completedAt.toISOString(), r.durationSec ?? "", ...(t.kind === "survey" ? [] : [pct(r.score, r.maxScore)]), ...qs.map((q) => answerText(a.find((x) => x.questionId === q.id)?.answer))].map(cell);
    });
    // Only this tab is cleared, and only because its name carries our prefix.
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${title}'!A1:ZZ5000` });
    await sheets.spreadsheets.values.update({ spreadsheetId, range: `'${title}'!A1`, valueInputOption: "RAW", requestBody: { values: [head, ...body] } });
    tabs++;
  }
  return { tabs };
}
