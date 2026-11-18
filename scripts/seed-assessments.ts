/**
 * Seeds the pre-tests, post-tests and surveys from docs/hub-v3/assessments.json. Idempotent: upserts by `key`.
 *   npx tsx scripts/seed-assessments.ts
 * - Every test is seeded closed (opensAt null). An admin opens it. A re-run keeps the schedule and the short code.
 * - A test that already has results is never touched. It is listed at the end.
 * - The Sandbox survey is a template: one copy per Sandbox event. The Bootcamp survey gets one copy per episode.
 * - `{{panelists}}` becomes the event's speakers. An event with none loses that question.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

interface Q { id: string; type: string; text: string; options?: string[]; [k: string]: unknown }
interface Section { title: string; questions: Q[] }
interface Assessment { key: string; pairKey: string; eventSlug: string; episode: number | null; kind: string; title: string; description: string; durationMinutes: number; passingScore: number; shuffleQuestions?: boolean; shuffleOptions?: boolean; showAnswersAfter: string; questions: Q[] }
interface Survey { key: string; kind: "survey"; eventSlug: string; episode: number | string | null; title: string; description: string; sections: Section[] }

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) { const c = newCode(); if (!(await prisma.test.findUnique({ where: { code: c }, select: { id: true } }))) return c; }
  throw new Error("could not find a free short code");
}

const skipped: string[] = [], created: string[] = [], updated: string[] = [], missingEvents = new Set<string>();

async function upsert(key: string, eventId: string, isSandbox: boolean, data: Record<string, unknown>) {
  const existing = await prisma.test.findUnique({ where: { key } });
  const common = { ...data, eventId, access: isSandbox ? "signed_in" : "registered" };
  if (existing) {
    if (await prisma.testResult.count({ where: { testId: existing.id } })) { skipped.push(`${key} (has results)`); return; }
    await prisma.test.update({ where: { id: existing.id }, data: common });
    updated.push(key);
  } else {
    await prisma.test.create({ data: { ...common, key, code: await uniqueCode(), opensAt: null, closesAt: null } as never });
    created.push(key);
  }
}

async function main() {
  const file = JSON.parse(readFileSync(join(process.cwd(), "docs/hub-v3/assessments.json"), "utf8")) as { assessments: Assessment[]; surveys: Survey[] };
  const events = await prisma.event.findMany({ select: { id: true, slug: true, type: true, speakers: true } });
  const bySlug = new Map(events.map((e) => [e.slug ?? "", e]));

  for (const a of file.assessments) {
    const ev = bySlug.get(a.eventSlug);
    if (!ev) { missingEvents.add(a.eventSlug); continue; }
    await upsert(a.key, ev.id, ev.type !== "bootcamp", {
      kind: a.kind, type: a.kind === "pre_test" ? "pre" : "post", pairKey: a.pairKey, episode: a.episode, title: a.title, description: a.description,
      questions: a.questions as never, sections: null, durationMinutes: a.durationMinutes, passingScore: a.passingScore,
      shuffleQuestions: a.shuffleQuestions ?? true, shuffleOptions: a.shuffleOptions ?? true, showAnswersAfter: a.showAnswersAfter,
    });
  }

  const pairOf = (slug: string, episode: number | null) => file.assessments.find((x) => x.eventSlug === slug && x.episode === episode)?.pairKey ?? null;
  const panelistNames = (speakers: unknown): string[] => (Array.isArray(speakers) ? speakers : []).map((s) => (s && typeof s === "object" ? String((s as { name?: unknown }).name ?? "") : "")).filter(Boolean);
  const fill = (sections: Section[], names: string[]): Section[] => sections.map((s) => ({
    ...s,
    questions: s.questions.flatMap((q) => {
      if (!q.options?.includes("{{panelists}}")) return [q];
      return names.length ? [{ ...q, options: names }] : [];
    }),
  }));

  for (const sv of file.surveys) {
    const targets: { key: string; slug: string; episode: number | null; title: string }[] = [];
    if (sv.eventSlug === "*sandbox*") for (const e of events.filter((x) => x.type !== "bootcamp" && x.slug)) targets.push({ key: `${sv.key}:${e.slug}`, slug: e.slug!, episode: null, title: sv.title });
    else if (sv.episode === "*") for (let n = 1; n <= 4; n++) targets.push({ key: `${sv.key}-ep${n}`, slug: sv.eventSlug, episode: n, title: `${sv.title} ${n}` });
    else targets.push({ key: sv.key, slug: sv.eventSlug, episode: typeof sv.episode === "number" ? sv.episode : null, title: sv.title });
    for (const t of targets) {
      const ev = bySlug.get(t.slug);
      if (!ev) { missingEvents.add(t.slug); continue; }
      await upsert(t.key, ev.id, ev.type !== "bootcamp", {
        kind: "survey", type: "post", pairKey: pairOf(t.slug, t.episode), episode: t.episode, title: t.title, description: sv.description, questions: [],
        sections: fill(sv.sections, panelistNames(ev.speakers)) as never, durationMinutes: 0, passingScore: 0, shuffleQuestions: false, shuffleOptions: false, showAnswersAfter: "never",
      });
    }
  }

  console.log(`created ${created.length}, updated ${updated.length}, skipped ${skipped.length}`);
  if (skipped.length) console.log("skipped:\n  " + skipped.join("\n  "));
  if (missingEvents.size) console.log(`events not found (run scripts/seed-events.ts first): ${[...missingEvents].join(", ")}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
