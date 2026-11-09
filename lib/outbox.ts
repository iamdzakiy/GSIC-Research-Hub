// ============================================================
// Durable outbox for e-mail and matching-sheet writes.
// Vercel stops a function once it has answered, so work is written to the DB first and
// drained right away (waitUntil) and again by the daily cron. A lease row keeps a single
// writer, so two concurrent sign-ups never claim the same sheet row. Session advisory
// locks are avoided on purpose: they are unreliable through the Supabase pooler.
// ============================================================
import "server-only";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/prisma";
import { sendMail, type MailInput } from "@/lib/mailer";
import type { Prisma } from "../generated/prisma/client";

export type OutboxKind = "email" | "sheet_upsert" | "sheet_clear";
export interface SheetUpsertPayload { userId: string }
export interface SheetClearPayload { email: string }

type Tx = Prisma.TransactionClient;
const BACKOFF_MIN = [1, 5, 30, 120, 720];
const BATCH = 25;
const LEASE_MS = 60_000;

/** Queues a job (inside `tx` when given) and starts a drain after the response. A duplicate `dedupeKey` is ignored. */
export async function enqueue(kind: OutboxKind, payload: MailInput | SheetUpsertPayload | SheetClearPayload, opts: { dedupeKey?: string; runAfter?: Date; tx?: Tx } = {}) {
  const db = opts.tx ?? prisma;
  await db.outboxJob.createMany({
    data: [{ kind, payload: payload as unknown as Prisma.InputJsonValue, dedupeKey: opts.dedupeKey ?? null, runAfter: opts.runAfter ?? new Date() }],
    skipDuplicates: true,
  });
  if (!opts.tx) kick();
}

/** Starts a background drain (no-op outside a request on Vercel; awaited nowhere). */
export function kick() {
  const p = drain().catch((e) => console.error("[outbox] drain failed:", (e as Error).message));
  try { waitUntil(p); } catch { /* not in a request context */ }
}

async function acquire(name: string): Promise<boolean> {
  const now = new Date();
  const until = new Date(now.getTime() + LEASE_MS);
  const n = await prisma.$executeRaw`INSERT INTO "JobLease" ("name", "expiresAt") VALUES (${name}, ${until})
    ON CONFLICT ("name") DO UPDATE SET "expiresAt" = ${until} WHERE "JobLease"."expiresAt" < ${now}`;
  return n > 0;
}
const release = (name: string) => prisma.jobLease.update({ where: { name }, data: { expiresAt: new Date(0) } }).catch(() => undefined);

export const maxMailsPerRun = () => Math.max(1, Number(process.env.SMTP_MAX_PER_RUN) || 80);

/** Runs due jobs once. Returns counts, or null when another runner holds the lease. */
export async function drain(): Promise<{ done: number; failed: number; left: boolean } | null> {
  if (!(await acquire("outbox"))) return null;
  try {
    const jobs = await prisma.outboxJob.findMany({
      where: { doneAt: null, failedAt: null, runAfter: { lte: new Date() } },
      orderBy: { createdAt: "asc" },
      take: BATCH,
    });
    let done = 0, failed = 0, mails = 0;
    const ok = async (ids: string[]) => { if (ids.length) { await prisma.outboxJob.updateMany({ where: { id: { in: ids } }, data: { doneAt: new Date() } }); done += ids.length; } };
    const bad = async (ids: string[], err: unknown) => {
      const msg = String((err as Error)?.message ?? err).slice(0, 500);
      for (const j of jobs.filter((x) => ids.includes(x.id))) {
        const attempts = j.attempts + 1;
        const gaveUp = attempts > BACKOFF_MIN.length;
        await prisma.outboxJob.update({
          where: { id: j.id },
          data: { attempts, lastError: msg, failedAt: gaveUp ? new Date() : null, runAfter: new Date(Date.now() + (BACKOFF_MIN[attempts - 1] ?? 0) * 60_000) },
        });
        failed++;
      }
    };

    // Sheet jobs: coalesced into one write each, with the latest DB data.
    const upserts = jobs.filter((j) => j.kind === "sheet_upsert");
    const clears = jobs.filter((j) => j.kind === "sheet_clear");
    if (upserts.length || clears.length) {
      const { syncUsersToSheet, clearSheetRows, sheetConfigured } = await import("@/lib/matchmaking-sheet");
      if (!sheetConfigured()) await ok([...upserts, ...clears].map((j) => j.id)); // nothing to mirror to
      else {
        if (upserts.length) {
          const ids = Array.from(new Set(upserts.map((j) => (j.payload as unknown as SheetUpsertPayload).userId)));
          try { await syncUsersToSheet(ids); await ok(upserts.map((j) => j.id)); } catch (e) { await bad(upserts.map((j) => j.id), e); }
        }
        if (clears.length) {
          const emails = Array.from(new Set(clears.map((j) => (j.payload as unknown as SheetClearPayload).email)));
          try { await clearSheetRows(emails); await ok(clears.map((j) => j.id)); } catch (e) { await bad(clears.map((j) => j.id), e); }
        }
      }
    }

    for (const j of jobs.filter((x) => x.kind === "email")) {
      if (mails >= maxMailsPerRun()) break;
      mails++;
      try { await sendMail(j.payload as unknown as MailInput); await ok([j.id]); } catch (e) { await bad([j.id], e); }
    }
    const left = (await prisma.outboxJob.count({ where: { doneAt: null, failedAt: null, runAfter: { lte: new Date() } } })) > 0;
    return { done, failed, left };
  } finally {
    await release("outbox");
  }
}

/** Drains until nothing is due, the mail budget for this run is used, or ~50 s pass (cron). */
export async function drainAll(budgetMs = 50_000) {
  const start = Date.now();
  let total = { done: 0, failed: 0 };
  while (Date.now() - start < budgetMs) {
    const r = await drain();
    if (!r) break;
    total = { done: total.done + r.done, failed: total.failed + r.failed };
    if (!r.left || r.done + r.failed === 0) break;
  }
  return total;
}

export async function outboxStatus() {
  const [pending, failed, last] = await Promise.all([
    prisma.outboxJob.count({ where: { doneAt: null, failedAt: null } }),
    prisma.outboxJob.count({ where: { failedAt: { not: null }, doneAt: null } }),
    prisma.outboxJob.findFirst({ where: { failedAt: { not: null }, doneAt: null }, orderBy: { failedAt: "desc" }, select: { kind: true, lastError: true, failedAt: true } }),
  ]);
  return { pending, failed, last };
}

export async function retryFailed() {
  const r = await prisma.outboxJob.updateMany({ where: { failedAt: { not: null }, doneAt: null }, data: { failedAt: null, attempts: 0, runAfter: new Date() } });
  kick();
  return r.count;
}

// Small key/value markers stored in JobLease.value (e.g. lastSheetSyncAt).
export async function getMarker(name: string) { return (await prisma.jobLease.findUnique({ where: { name } }))?.value ?? null; }
export async function setMarker(name: string, value: string) {
  await prisma.jobLease.upsert({ where: { name }, update: { value }, create: { name, value, expiresAt: new Date(0) } });
}
