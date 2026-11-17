// Admin analytics for tests and surveys. Pure: rows in, numbers out. Nothing here reads the database.
import { answerText, normalisedGain, pct, questionsOf, type AnswerIn, type Question } from "@/lib/scoring";

export interface ATest { id: string; key: string | null; kind: string; title: string; episode: number | null; pairKey: string | null; questions: unknown; sections?: unknown }
export interface AResult { testId: string; userId: string; score: number; maxScore: number; answers: unknown }

export const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

/** Counts of percentages in bins of 10: 0-9, 10-19, ... 90-100. */
export function histogram(percents: number[]): number[] {
  const bins = Array<number>(10).fill(0);
  for (const p of percents) bins[Math.min(9, Math.max(0, Math.floor(p / 10)))]++;
  return bins;
}

export interface QuestionStat { id: string; text: string; preCorrect: number | null; postCorrect: number | null; topWrong: { option: string; count: number } | null; flag: "too_hard" | "too_easy" | null; n: number }
export interface PairStats {
  pairKey: string; episode: number | null; title: string;
  pre: { n: number; mean: number | null; median: number | null; bins: number[] };
  post: { n: number; mean: number | null; median: number | null; bins: number[] };
  both: number; meanGain: number | null; questions: QuestionStat[];
}

const answerOf = (r: AResult | undefined, id: string): string => {
  const a = r && Array.isArray(r.answers) ? (r.answers as AnswerIn[]).find((x) => x.questionId === id) : undefined;
  return a ? answerText(a.answer).trim() : "";
};
const isRight = (q: Question, a: string) => a !== "" && a.toLowerCase() === (q.correctAnswer ?? "").trim().toLowerCase();

export function analysePair(pre: ATest | undefined, post: ATest | undefined, results: AResult[]): PairStats {
  const t = (post ?? pre)!;
  const of = (test?: ATest) => (test ? results.filter((r) => r.testId === test.id) : []);
  const rPre = of(pre), rPost = of(post);
  const pP = rPre.map((r) => pct(r.score, r.maxScore)), pQ = rPost.map((r) => pct(r.score, r.maxScore));
  const byUserPre = new Map(rPre.map((r) => [r.userId, r])), byUserPost = new Map(rPost.map((r) => [r.userId, r]));
  const gains: number[] = [];
  for (const [uid, a] of byUserPre) { const b = byUserPost.get(uid); if (!b) continue; const g = normalisedGain(pct(a.score, a.maxScore), pct(b.score, b.maxScore)); if (g !== null) gains.push(g); }

  const qs = questionsOf(post ?? pre!).filter((q) => q.type === "multiple_choice");
  const questions = qs.map<QuestionStat>((q) => {
    const share = (rs: AResult[]) => (rs.length ? Math.round((rs.filter((r) => isRight(q, answerOf(r, q.id))).length / rs.length) * 100) : null);
    const preC = share(rPre), postC = share(rPost);
    const tally = new Map<string, number>();
    for (const r of rPost.length ? rPost : rPre) { const a = answerOf(r, q.id); if (a && !isRight(q, a)) tally.set(a, (tally.get(a) ?? 0) + 1); }
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    const probe = [preC, postC].filter((x): x is number => x !== null);
    const flag = probe.some((x) => x < 20) ? "too_hard" : probe.some((x) => x > 95) ? "too_easy" : null;
    return { id: q.id, text: q.text, preCorrect: preC, postCorrect: postC, topWrong: top ? { option: top[0], count: top[1] } : null, flag, n: Math.max(rPre.length, rPost.length) };
  });
  return {
    pairKey: t.pairKey ?? t.id, episode: t.episode, title: t.title,
    pre: { n: rPre.length, mean: r1(mean(pP)), median: r1(median(pP)), bins: histogram(pP) },
    post: { n: rPost.length, mean: r1(mean(pQ)), median: r1(median(pQ)), bins: histogram(pQ) },
    both: gains.length, meanGain: gains.length ? Math.round(mean(gains)! * 100) / 100 : null, questions,
  };
}

export interface SurveyItemStat {
  id: string; text: string; type: string; n: number;
  distribution?: { label: string; count: number }[]; mean?: number | null;
  nps?: { score: number | null; promoters: number; passives: number; detractors: number };
  texts?: string[];
}
export function analyseSurvey(test: ATest, results: AResult[]): { title: string; n: number; items: SurveyItemStat[] } {
  const rs = results.filter((r) => r.testId === test.id);
  const items = questionsOf(test).map<SurveyItemStat>((q) => {
    const raw = rs.map((r) => (r && Array.isArray(r.answers) ? (r.answers as AnswerIn[]).find((a) => a.questionId === q.id)?.answer : undefined)).filter((a): a is string | string[] => a !== undefined && (Array.isArray(a) ? a.length > 0 : String(a).trim() !== ""));
    const base = { id: q.id, text: q.text, type: q.type, n: raw.length };
    if (q.type === "likert" || q.type === "nps") {
      const nums = raw.map((a) => Number(Array.isArray(a) ? a[0] : a)).filter(Number.isFinite);
      if (q.type === "nps") {
        const pro = nums.filter((n) => n >= 9).length, det = nums.filter((n) => n <= 6).length, pas = nums.length - pro - det;
        return { ...base, mean: r1(mean(nums)), nps: { score: nums.length ? Math.round(((pro - det) / nums.length) * 100) : null, promoters: pro, passives: pas, detractors: det }, distribution: Array.from({ length: 11 }, (_, i) => ({ label: String(i), count: nums.filter((n) => n === i).length })) };
      }
      const scale = q.scale ?? 5;
      return { ...base, mean: r1(mean(nums)), distribution: Array.from({ length: scale }, (_, i) => ({ label: String(i + 1), count: nums.filter((n) => n === i + 1).length })) };
    }
    if (q.type === "single_choice" || q.type === "multi_select") {
      const tally = new Map<string, number>();
      for (const a of raw) for (const v of Array.isArray(a) ? a : [a]) tally.set(v, (tally.get(v) ?? 0) + 1);
      return { ...base, distribution: [...tally.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count) };
    }
    return { ...base, texts: raw.map((a) => answerText(a)) };
  });
  return { title: test.title, n: rs.length, items };
}
