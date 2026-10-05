// Pure scoring + report-card (rapor) logic. No I/O, so it is unit-testable and shared
// by the API (authoritative scoring) and the UI.

export interface Question { id: string; text: string; type: "multiple_choice" | "essay"; options?: string[]; correctAnswer?: string; points: number }
export interface AnswerIn { questionId: string; answer: string }

export interface QuestionResult { questionId: string; text: string; type: Question["type"]; points: number; earned: number; answer: string; correctAnswer?: string; correct: boolean | null }
export interface Scored { score: number; maxScore: number; percent: number; detail: QuestionResult[] }

export const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 100) : 0);

/** Multiple choice: exact match with correctAnswer. Essay: full points when non-empty (manual review), correct=null. */
export function scoreTest(questions: Question[], answers: AnswerIn[]): Scored {
  const byId = new Map<string, string>();
  for (const a of answers) if (a && typeof a.questionId === "string") byId.set(a.questionId, String(a.answer ?? "").slice(0, 5000));
  let score = 0, maxScore = 0;
  const detail = questions.map<QuestionResult>((q) => {
    const points = Number.isFinite(q.points) && q.points > 0 ? q.points : 0;
    maxScore += points;
    const answer = byId.get(q.id) ?? "";
    let earned = 0, correct: boolean | null = null;
    if (q.type === "multiple_choice") {
      const want = (q.correctAnswer ?? "").trim().toLowerCase();
      correct = answer.trim() !== "" && want !== "" && answer.trim().toLowerCase() === want;
      if (correct) earned = points;
    } else if (answer.trim() !== "") earned = points;
    score += earned;
    return { questionId: q.id, text: q.text, type: q.type, points, earned, answer, correctAnswer: q.correctAnswer, correct };
  });
  return { score, maxScore, percent: pct(score, maxScore), detail };
}

export function missingAnswers(questions: Question[], answers: AnswerIn[]): number {
  const have = new Set(answers.filter((a) => String(a?.answer ?? "").trim() !== "").map((a) => a.questionId));
  return questions.filter((q) => !have.has(q.id)).length;
}

// ---------------- Rapor ----------------
export interface RaporAttempt { testId: string; title: string; score: number; maxScore: number; percent: number; passingScore: number; passed: boolean; completedAt: string; detail?: QuestionResult[] }
export interface RaporEvent {
  eventId: string; title: string; type: string; startDate: string; location: string;
  registeredAt: string;
  pre: RaporAttempt | null; post: RaporAttempt | null;
  /** post% - pre% (null until both exist) */
  gain: number | null;
  stage: "registered" | "pre_done" | "completed";
  verdict: "improved" | "same" | "declined" | null;
}
export interface RaporSummary { events: number; completed: number; avgPre: number | null; avgPost: number | null; avgGain: number | null; best: { title: string; gain: number } | null }

interface EvIn { id: string; title: string; type: string; startDate: Date | string; location: string }
interface TestIn { id: string; eventId: string; type: "pre" | "post"; title: string; passingScore: number; questions: unknown }
interface ResIn { testId: string; answers: unknown; score: number; maxScore: number; completedAt: Date | string }
interface RegIn { eventId: string; registeredAt: Date | string }

const iso = (d: Date | string) => (typeof d === "string" ? d : d.toISOString());

export function buildRapor(regs: RegIn[], events: EvIn[], tests: TestIn[], results: ResIn[]): { events: RaporEvent[]; summary: RaporSummary } {
  const evById = new Map(events.map((e) => [e.id, e]));
  const testById = new Map(tests.map((t) => [t.id, t]));
  // latest result per test
  const latest = new Map<string, ResIn>();
  for (const r of results) {
    const cur = latest.get(r.testId);
    if (!cur || new Date(r.completedAt) > new Date(cur.completedAt)) latest.set(r.testId, r);
  }
  const attempt = (t: TestIn | undefined, withDetail: boolean): RaporAttempt | null => {
    if (!t) return null;
    const r = latest.get(t.id);
    if (!r) return null;
    const percent = pct(r.score, r.maxScore);
    const answers = Array.isArray(r.answers) ? (r.answers as AnswerIn[]) : [];
    return {
      testId: t.id, title: t.title, score: r.score, maxScore: r.maxScore, percent, passingScore: t.passingScore,
      // passingScore is stored as a percentage in the GSIC admin form (e.g. 70)
      passed: percent >= t.passingScore, completedAt: iso(r.completedAt),
      detail: withDetail && Array.isArray(t.questions) ? scoreTest(t.questions as Question[], answers).detail : undefined,
    };
  };

  const out: RaporEvent[] = [];
  for (const reg of regs) {
    const ev = evById.get(reg.eventId);
    if (!ev) continue;
    const evTests = tests.filter((t) => t.eventId === ev.id);
    const preT = evTests.find((t) => t.type === "pre"), postT = evTests.find((t) => t.type === "post");
    const hasBoth = !!latest.get(preT?.id ?? "") && !!latest.get(postT?.id ?? "");
    const pre = attempt(preT, hasBoth), post = attempt(postT, hasBoth);
    const gain = pre && post ? post.percent - pre.percent : null;
    out.push({
      eventId: ev.id, title: ev.title, type: ev.type, startDate: iso(ev.startDate), location: ev.location, registeredAt: iso(reg.registeredAt),
      pre, post, gain, stage: pre && post ? "completed" : pre ? "pre_done" : "registered",
      verdict: gain === null ? null : gain > 0 ? "improved" : gain < 0 ? "declined" : "same",
    });
  }
  out.sort((a, b) => b.startDate.localeCompare(a.startDate));
  const done = out.filter((e) => e.gain !== null);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const best = done.reduce<{ title: string; gain: number } | null>((b, e) => (e.gain! > (b?.gain ?? -Infinity) ? { title: e.title, gain: e.gain! } : b), null);
  return {
    events: out,
    summary: {
      events: out.length, completed: done.length,
      avgPre: avg(done.map((e) => e.pre!.percent)), avgPost: avg(done.map((e) => e.post!.percent)), avgGain: avg(done.map((e) => e.gain!)), best,
    },
  };
}

export const raporToCsv = (events: RaporEvent[]): string => {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Kegiatan", "Tanggal", "Pre-test (%)", "Post-test (%)", "Selisih", "Status"]];
  for (const e of events) rows.push([e.title, e.startDate.slice(0, 10), e.pre?.percent ?? "", e.post?.percent ?? "", e.gain ?? "", e.stage] as never);
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
};
