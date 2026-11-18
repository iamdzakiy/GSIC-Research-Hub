// Report card v3: one entry per event, and per episode for the PKM Bootcamp.
// Pure and I/O free so it can be unit tested. The API passes in rows; nothing here reads the database.
import { gainBand, normalisedGain, pct, questionsOf, scoreTest, type AnswerIn, type GainBand, type QuestionResult } from "@/lib/scoring";
import type { RaporEvent, RaporSummary } from "@/lib/scoring";

export interface RTest {
  id: string; eventId: string; kind: string; pairKey: string | null; episode: number | null; title: string; passingScore: number;
  showAnswersAfter: string; questions: unknown; sections?: unknown; key?: string | null;
}
export interface RResult { testId: string; answers: unknown; score: number; maxScore: number; completedAt: Date | string }
export interface REvent { id: string; slug?: string | null; title: string; type: string; startDate: Date | string | null; location: string | null; certificateEnabled?: boolean }
export interface RReg { eventId: string; registeredAt: Date | string }

export type EpisodeStatus = "pre_pending" | "post_pending" | "survey_pending" | "completed";
export interface ReviewRow { questionId: string; text: string; answer: string; correct: boolean | null; correctAnswer?: string; explanation?: string }
export interface RaporEpisode {
  episode: number | null; pairKey: string; title: string; status: EpisodeStatus;
  /** Hidden until the episode survey is done (when one exists). */
  locked: boolean; surveyId: string | null; postId: string | null; preId: string | null;
  prePercent: number | null; postPercent: number | null; delta: number | null;
  nGain: number | null; band: GainBand | null; fullAlready: boolean;
  passed: boolean | null; passingScore: number;
  confidence: { pre: number | null; post: number | null };
  review: ReviewRow[] | null;
}
export interface RaporEventV3 extends RaporEvent {
  slug: string | null; episodes: RaporEpisode[]; isBootcamp: boolean; certificateEnabled: boolean;
  confidence: { pre: number | null; post: number | null } | null;
  todo: { label: string; testId: string }[];
}
export interface RaporV3 { events: RaporEventV3[]; summary: RaporSummary }

const iso = (d: Date | string) => (typeof d === "string" ? d : d.toISOString());
const answersOf = (r: RResult | undefined): AnswerIn[] => (r && Array.isArray(r.answers) ? (r.answers as AnswerIn[]) : []);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

/** Mean of the two confidence items (likert ids ending in -c1 and -c2) of one test. */
function confidenceOf(t: RTest | undefined, r: RResult | undefined): number | null {
  if (!t || !r) return null;
  const vals = answersOf(r).filter((a) => /-c[12]$/.test(a.questionId)).map((a) => Number(Array.isArray(a.answer) ? a.answer[0] : a.answer)).filter((n) => Number.isFinite(n) && n > 0);
  return round1(mean(vals));
}

export function buildRaporV3(regs: RReg[], events: REvent[], tests: RTest[], results: RResult[]): RaporV3 {
  const evById = new Map(events.map((e) => [e.id, e]));
  const res = new Map<string, RResult>();
  for (const r of results) { const c = res.get(r.testId); if (!c || new Date(r.completedAt) < new Date(c.completedAt)) res.set(r.testId, r); }

  const out: RaporEventV3[] = [];
  const pairs: { eventId: string; title: string; pre: number; post: number }[] = [];

  for (const reg of regs) {
    const ev = evById.get(reg.eventId);
    if (!ev) continue;
    const evTests = tests.filter((t) => t.eventId === ev.id);
    const groups = new Map<string, RTest[]>();
    for (const t of evTests) { const k = t.pairKey ?? `solo:${t.id}`; groups.set(k, [...(groups.get(k) ?? []), t]); }

    const episodes: RaporEpisode[] = [];
    const todo: RaporEventV3["todo"] = [];
    for (const [pairKey, g] of groups) {
      const pre = g.find((t) => t.kind === "pre_test"), post = g.find((t) => t.kind === "post_test"), survey = g.find((t) => t.kind === "survey");
      if (!pre && !post) continue;
      const rPre = pre ? res.get(pre.id) : undefined, rPost = post ? res.get(post.id) : undefined, rSv = survey ? res.get(survey.id) : undefined;
      const prePercent = rPre ? pct(rPre.score, rPre.maxScore) : null, postPercent = rPost ? pct(rPost.score, rPost.maxScore) : null;
      const both = prePercent !== null && postPercent !== null;
      const fullAlready = prePercent === 100;
      const ng = both ? normalisedGain(prePercent!, postPercent!) : null;
      const locked = !!survey && !rSv && !!rPost; // an episode entry opens with its survey
      const status: EpisodeStatus = !rPre ? "pre_pending" : !rPost ? "post_pending" : survey && !rSv ? "survey_pending" : "completed";
      const reviewOk = !!post && !!rPost && post.showAnswersAfter !== "never" && (!survey || !!rSv);
      const detail: QuestionResult[] = reviewOk ? scoreTest(questionsOf(post!), answersOf(rPost)).detail.filter((d) => d.type === "multiple_choice") : [];
      episodes.push({
        episode: (pre ?? post)!.episode, pairKey, title: (post ?? pre)!.title, status, locked, surveyId: survey?.id ?? null, postId: post?.id ?? null, preId: pre?.id ?? null,
        prePercent: locked ? null : prePercent, postPercent: locked ? null : postPercent, delta: both && !locked ? postPercent! - prePercent! : null,
        nGain: both && !locked ? ng : null, band: both && !locked && ng !== null ? gainBand(ng) : null, fullAlready: both && !locked && fullAlready,
        passed: post && post.passingScore > 0 && postPercent !== null && !locked ? postPercent >= post.passingScore : null, passingScore: post?.passingScore ?? 0,
        confidence: { pre: confidenceOf(pre, rPre), post: confidenceOf(post, rPost) },
        review: reviewOk ? detail.map((d) => ({ questionId: d.questionId, text: d.text, answer: d.answer, correct: d.correct, correctAnswer: d.correctAnswer, explanation: d.explanation })) : null,
      });
      if (!rPre && pre) todo.push({ label: `Pre-test: ${pre.title}`, testId: pre.id });
      else if (!rPost && post) todo.push({ label: `Post-test: ${post.title}`, testId: post.id });
      else if (survey && !rSv) todo.push({ label: `Survey: ${survey.title}`, testId: survey.id });
      if (both && !locked) pairs.push({ eventId: ev.id, title: ev.title, pre: prePercent!, post: postPercent! });
    }
    episodes.sort((a, b) => (a.episode ?? 99) - (b.episode ?? 99));

    const shown = episodes.filter((e) => !e.locked && e.delta !== null);
    const gain = shown.length ? Math.round(mean(shown.map((e) => e.delta!))!) : null;
    const stage: RaporEvent["stage"] = episodes.length && episodes.every((e) => e.status === "completed") ? "completed" : episodes.some((e) => e.status !== "pre_pending") ? "pre_done" : "registered";
    const first = episodes.find((e) => e.prePercent !== null);
    const c = { pre: round1(mean(episodes.map((e) => e.confidence.pre).filter((x): x is number => x !== null))), post: round1(mean(episodes.map((e) => e.confidence.post).filter((x): x is number => x !== null))) };

    out.push({
      eventId: ev.id, slug: ev.slug ?? null, title: ev.title, type: ev.type, startDate: ev.startDate ? iso(ev.startDate) : "", location: ev.location ?? "", registeredAt: iso(reg.registeredAt),
      pre: null, post: null, gain, stage, verdict: gain === null ? null : gain > 0 ? "improved" : gain < 0 ? "declined" : "same",
      episodes, isBootcamp: episodes.some((e) => e.episode !== null), certificateEnabled: !!ev.certificateEnabled,
      confidence: c.pre !== null || c.post !== null ? c : null, todo,
    });
    void first;
  }
  out.sort((a, b) => b.startDate.localeCompare(a.startDate));

  const done = out.filter((e) => e.gain !== null);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const best = done.reduce<{ title: string; gain: number } | null>((b, e) => (e.gain! > (b?.gain ?? -Infinity) ? { title: e.title, gain: e.gain! } : b), null);
  return { events: out, summary: { events: out.length, completed: out.filter((e) => e.stage === "completed").length, avgPre: avg(pairs.map((p) => p.pre)), avgPost: avg(pairs.map((p) => p.post)), avgGain: avg(pairs.map((p) => p.post - p.pre)), best } };
}
