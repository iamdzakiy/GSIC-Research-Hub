// Loads one event's results for the admin screens, the CSV and the sheet sync. Admin only: it carries NIM and names.
import "server-only";
import { prisma } from "@/lib/prisma";
import { analysePair, analyseSurvey, mean, type ATest } from "@/lib/analytics";
import { pct } from "@/lib/scoring";

export interface Filters { faculty?: string; major?: string; year?: number }
export interface ParticipantRow {
  userId: string; nim: string | null; name: string; faculty: string; major: string; year: number | null;
  pre: number | null; post: number | null; surveys: string; status: "registered" | "in_progress" | "completed"; scores: Record<string, number>;
}

export async function eventResults(eventId: string, f: Filters = {}) {
  const [tests, regs] = await Promise.all([
    prisma.test.findMany({ where: { eventId }, orderBy: [{ episode: "asc" }, { key: "asc" }] }),
    prisma.registration.findMany({ where: { eventId, status: { notIn: ["cancelled", "waitlisted"] } }, select: { userId: true } }),
  ]);
  const raw = await prisma.testResult.findMany({ where: { testId: { in: tests.map((t) => t.id) } } });
  const ids = Array.from(new Set([...regs.map((r) => r.userId), ...raw.map((r) => r.userId)]));
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, nim: true, name: true, faculty: true, major: true, year: true } });

  const options = {
    faculties: Array.from(new Set(users.map((u) => u.faculty).filter((x): x is string => !!x))).sort(),
    majors: Array.from(new Set(users.map((u) => u.major).filter((x): x is string => !!x))).sort(),
    years: Array.from(new Set(users.map((u) => u.year).filter((x): x is number => !!x))).sort((a, b) => b - a),
  };
  const keep = new Set(users.filter((u) => (!f.faculty || u.faculty === f.faculty) && (!f.major || u.major === f.major) && (!f.year || u.year === f.year)).map((u) => u.id));
  const results = raw.filter((r) => keep.has(r.userId));

  const asA = (t: (typeof tests)[number]): ATest => ({ id: t.id, key: t.key, kind: t.kind, title: t.title, episode: t.episode, pairKey: t.pairKey, questions: t.questions, sections: t.sections });
  const groups = new Map<string, typeof tests>();
  for (const t of tests.filter((x) => x.kind !== "survey")) groups.set(t.pairKey ?? t.id, [...(groups.get(t.pairKey ?? t.id) ?? []), t]);
  const rr = results.map((r) => ({ testId: r.testId, userId: r.userId, score: r.score, maxScore: r.maxScore, answers: r.answers }));
  const pairs = [...groups.values()].map((g) => analysePair(g.find((t) => t.kind === "pre_test") && asA(g.find((t) => t.kind === "pre_test")!), g.find((t) => t.kind === "post_test") && asA(g.find((t) => t.kind === "post_test")!), rr));
  const surveys = tests.filter((t) => t.kind === "survey").map((t) => analyseSurvey(asA(t), rr));

  const surveyTests = tests.filter((t) => t.kind === "survey");
  const participants: ParticipantRow[] = users.filter((u) => keep.has(u.id)).map((u) => {
    const mine = results.filter((r) => r.userId === u.id);
    const byTest = new Map(mine.map((r) => [r.testId, r]));
    const scores: Record<string, number> = {};
    for (const t of tests) { const r = byTest.get(t.id); if (r && t.kind !== "survey") scores[t.key ?? t.id] = pct(r.score, r.maxScore); }
    const avg = (kind: string) => { const v = tests.filter((t) => t.kind === kind && byTest.has(t.id)).map((t) => pct(byTest.get(t.id)!.score, byTest.get(t.id)!.maxScore)); const m = mean(v); return m === null ? null : Math.round(m); };
    const svDone = surveyTests.filter((t) => byTest.has(t.id)).length;
    const need = tests.length;
    return {
      userId: u.id, nim: u.nim, name: u.name ?? "", faculty: u.faculty ?? "", major: u.major ?? "", year: u.year,
      pre: avg("pre_test"), post: avg("post_test"), surveys: surveyTests.length ? `${svDone}/${surveyTests.length}` : "–",
      status: (mine.length === 0 ? "registered" : mine.length >= need ? "completed" : "in_progress") as ParticipantRow["status"], scores,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return { options, tests: tests.map((t) => ({ id: t.id, key: t.key, title: t.title, kind: t.kind, episode: t.episode })), pairs, surveys, participants };
}

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;

/** CSV with the NIM. Cells that start with = + - @ are neutralised so a spreadsheet never runs them. */
export function participantsCsv(r: Awaited<ReturnType<typeof eventResults>>): string {
  const keys = r.tests.filter((t) => t.kind !== "survey").map((t) => t.key ?? t.id);
  const head = ["NIM", "Name", "Faculty", "Major", "Intake", ...keys, "Pre (mean %)", "Post (mean %)", "Surveys", "Status"];
  const rows = r.participants.map((p) => [p.nim ?? "", p.name, p.faculty, p.major, p.year ?? "", ...keys.map((k) => p.scores[k] ?? ""), p.pre ?? "", p.post ?? "", p.surveys, p.status]);
  return "﻿" + [head, ...rows].map((row) => row.map(esc).join(",")).join("\r\n");
}
