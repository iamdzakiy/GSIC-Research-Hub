// Pure scoring + report-card logic. No I/O, so it is unit-testable and shared
// by the API (authoritative scoring) and the UI.

export type QuestionType = "multiple_choice" | "essay" | "likert" | "nps" | "single_choice" | "multi_select" | "short_text" | "long_text";
/** Only these are scored. Everything else has 0 points and never changes a score. */
export const SCORED_TYPES: readonly QuestionType[] = ["multiple_choice", "essay"];

export interface Question {
  id: string; text: string; type: QuestionType; options?: string[]; correctAnswer?: string; points: number; explanation?: string;
  required?: boolean; scale?: number; lowLabel?: string; highLabel?: string; maxLength?: number;
}
export interface AnswerIn { questionId: string; answer: string | string[] }

export interface QuestionResult { questionId: string; text: string; type: Question["type"]; points: number; earned: number; answer: string; correctAnswer?: string; correct: boolean | null; explanation?: string; options?: string[] }
export interface Scored { score: number; maxScore: number; percent: number; detail: QuestionResult[] }

export const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 100) : 0);

/** One string per answer. A multi-select answer is its options joined with " | ". */
export const answerText = (a: string | string[] | undefined | null): string => (Array.isArray(a) ? a.join(" | ") : String(a ?? "")).slice(0, 5000);
const hasAnswer = (a: string | string[] | undefined) => (Array.isArray(a) ? a.length > 0 : String(a ?? "").trim() !== "");

/** Survey sections flattened to one question list. */
export function flattenSections(sections: unknown): Question[] {
  if (!Array.isArray(sections)) return [];
  return sections.flatMap((s) => (s && typeof s === "object" && Array.isArray((s as { questions?: unknown }).questions) ? ((s as { questions: Question[] }).questions) : []));
}

/** The question list of a test, from `questions` or (for surveys) its sections. */
export const questionsOf = (t: { questions: unknown; sections?: unknown }): Question[] =>
  Array.isArray(t.questions) && t.questions.length ? (t.questions as Question[]) : flattenSections(t.sections);

/**
 * Multiple choice: option text compared case-insensitively with correctAnswer, so shuffling is safe.
 * Essay (old tests): full points when non-empty, correct=null. Unscored types: 0 points, correct=null.
 */
export function scoreTest(questions: Question[], answers: AnswerIn[]): Scored {
  const byId = new Map<string, string | string[]>();
  for (const a of answers) if (a && typeof a.questionId === "string") byId.set(a.questionId, a.answer);
  let score = 0, maxScore = 0;
  const detail = questions.map<QuestionResult>((q) => {
    const scored = SCORED_TYPES.includes(q.type);
    const points = scored && Number.isFinite(q.points) && q.points > 0 ? q.points : 0;
    maxScore += points;
    const raw = byId.get(q.id);
    const answer = answerText(raw);
    let earned = 0, correct: boolean | null = null;
    if (q.type === "multiple_choice") {
      const want = (q.correctAnswer ?? "").trim().toLowerCase();
      correct = answer.trim() !== "" && want !== "" && answer.trim().toLowerCase() === want;
      if (correct) earned = points;
    } else if (q.type === "essay" && answer.trim() !== "") earned = points;
    score += earned;
    return { questionId: q.id, text: q.text, type: q.type, points, earned, answer, correctAnswer: q.correctAnswer, correct, explanation: q.explanation, options: q.options };
  });
  return { score, maxScore, percent: pct(score, maxScore), detail };
}

/** Number of scored questions left blank. */
export function missingAnswers(questions: Question[], answers: AnswerIn[]): number {
  const have = new Set(answers.filter((a) => hasAnswer(a?.answer)).map((a) => a.questionId));
  return questions.filter((q) => SCORED_TYPES.includes(q.type) && !have.has(q.id)).length;
}

/**
 * Checks answers against the question definitions. Returns a message per question id.
 * `enforceRequired` is off when a timed test is finished by the clock, so a half-done test still counts.
 */
export function validateAnswers(questions: Question[], answers: AnswerIn[], enforceRequired = true): Record<string, string> {
  const byId = new Map(answers.map((a) => [a.questionId, a.answer]));
  const errs: Record<string, string> = {};
  for (const q of questions) {
    const a = byId.get(q.id);
    const blank = !hasAnswer(a);
    // Scored items are optional (blank = wrong). Unscored items follow their `required` flag.
    const required = SCORED_TYPES.includes(q.type) ? false : q.required === true;
    if (blank) { if (required && enforceRequired) errs[q.id] = "Required"; continue; }
    const t = answerText(a);
    const n = Number(t);
    switch (q.type) {
      case "likert": if (!Number.isInteger(n) || n < 1 || n > (q.scale ?? 5)) errs[q.id] = "Pick a value on the scale"; break;
      case "nps": if (!Number.isInteger(n) || n < 0 || n > 10) errs[q.id] = "Pick a number from 0 to 10"; break;
      case "multiple_choice": case "single_choice": if (Array.isArray(a) || !(q.options ?? []).some((o) => o === t)) errs[q.id] = "Pick one of the options"; break;
      case "multi_select": if (!Array.isArray(a) || a.some((x) => !(q.options ?? []).includes(x))) errs[q.id] = "Pick from the options"; break;
      case "short_text": case "long_text": case "essay": if (t.length > (q.maxLength ?? (q.type === "short_text" ? 200 : 2000))) errs[q.id] = "That is too long"; break;
    }
  }
  return errs;
}

/** Normalised gain: (post - pre) / (100 - pre), with percentages. Null when the pre-test was already 100. */
export function normalisedGain(prePct: number, postPct: number): number | null {
  if (prePct >= 100) return null;
  return (postPct - prePct) / (100 - prePct);
}
export type GainBand = "low" | "medium" | "high";
export const gainBand = (g: number): GainBand => (g < 0.3 ? "low" : g < 0.7 ? "medium" : "high");

// ---------------- Report card ----------------
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

interface EvIn { id: string; title: string; type: string; startDate: Date | string | null; location: string | null }
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
      eventId: ev.id, title: ev.title, type: ev.type, startDate: ev.startDate ? iso(ev.startDate) : "", location: ev.location ?? "", registeredAt: iso(reg.registeredAt),
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
  const rows = [["Event", "Date", "Pre-test (%)", "Post-test (%)", "Gain", "Stage"]];
  for (const e of events) rows.push([e.title, e.startDate.slice(0, 10), e.pre?.percent ?? "", e.post?.percent ?? "", e.gain ?? "", e.stage] as never);
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
};
