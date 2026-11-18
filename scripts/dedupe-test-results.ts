// Run BEFORE `prisma db push` adds @@unique([testId, userId]) to TestResult.
// Keeps the earliest result for each (test, person) and deletes the rest. Idempotent: a second run finds nothing.
// Usage: npx tsx scripts/dedupe-test-results.ts [--dry]
import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const dry = process.argv.includes("--dry");
  const rows = await prisma.$queryRaw<{ id: string; testId: string; userId: string }[]>`
    SELECT id, "testId", "userId" FROM "TestResult" ORDER BY "completedAt" ASC, id ASC`;
  const seen = new Set<string>();
  const drop: string[] = [];
  for (const r of rows) {
    const k = `${r.testId}:${r.userId}`;
    if (seen.has(k)) drop.push(r.id); else seen.add(k);
  }
  console.log(`${rows.length} results, ${drop.length} duplicates${dry ? " (dry run, nothing deleted)" : ""}`);
  if (!dry && drop.length) console.log(`deleted ${(await prisma.testResult.deleteMany({ where: { id: { in: drop } } })).count}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
