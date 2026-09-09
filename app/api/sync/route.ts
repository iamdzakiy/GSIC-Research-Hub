import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { writeSheet, SheetName, SheetRow } from "@/lib/googleSheets";

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const body = await request.json().catch(() => null) as { targets?: SheetName[] } | null;
  const targets = body?.targets?.length
    ? body.targets
    : (["users", "registrations", "testResults"] as SheetName[]);

  // Pull latest data to keep the spreadsheet in sync with the database.
  const [users, registrations, testResults] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.registration.findMany({
      orderBy: { registeredAt: "desc" },
      include: { user: true, event: true },
    }),
    prisma.testResult.findMany({
      orderBy: { completedAt: "desc" },
      include: { user: true, test: true },
    }),
  ]);

  const results: Partial<Record<SheetName, number>> = {};
  let error: string | null = null;

  const userRows: SheetRow[] = users.map((u) => [
    u.htaId,
    u.name || "",
    u.email,
    u.faculty || "",
    u.major || "",
    u.year || "",
    u.whatsapp || "",
    u.role,
    u.isVerified,
    u.createdAt.toISOString(),
  ]);

  const registrationRows: SheetRow[] = registrations.map((r) => [
    r.user.name || r.user.email,
    r.user.email,
    r.event.title,
    r.status,
    r.preTestCompleted,
    r.postTestCompleted,
    r.registeredAt.toISOString(),
  ]);

  const testResultRows: SheetRow[] = testResults.map((t) => [
    t.user.name || t.user.email,
    t.user.email,
    t.test.title,
    t.test.type,
    t.test.eventId,
    t.score,
    t.maxScore,
    t.completedAt.toISOString(),
  ]);

  try {
    if (targets.includes("users")) results.users = (await writeSheet("users", userRows)).written;
    if (targets.includes("registrations"))
      results.registrations = (await writeSheet("registrations", registrationRows)).written;
    if (targets.includes("testResults"))
      results.testResults = (await writeSheet("testResults", testResultRows)).written;
  } catch (e) {
    error = e instanceof Error ? e.message : "Google Sheets sync failed";
  }

  if (error) {
    return NextResponse.json({ success: false, error, results }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    results,
    summary: {
      users: users.length,
      registrations: registrations.length,
      testResults: testResults.length,
    },
  });
});