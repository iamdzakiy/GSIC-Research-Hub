import "server-only";
// The PKM Bootcamp article series: its parts, the quiz that belongs to each episode article, and whether the Bootcamp is live.
import { prisma } from "@/lib/prisma";

export const BOOTCAMP_SERIES = "PKM Bootcamp";
export const BOOTCAMP_EVENT_SLUG = "pkm-bootcamp-2027";

export interface SeriesPart { slug: string; title: string; seriesOrder: number; coverImage: string | null; excerpt: string | null }

export async function getSeriesParts(series: string): Promise<SeriesPart[]> {
  const rows = await prisma.blogPost.findMany({
    where: { series, status: "published" }, orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
    select: { slug: true, title: true, seriesOrder: true, coverImage: true, excerpt: true },
  });
  return rows.map((r, i) => ({ ...r, seriesOrder: r.seriesOrder ?? i }));
}

/** "pkm-bootcamp-ep3-menulis-proposal" -> 3. Only the four episode articles match. */
export const episodeFromSlug = (slug: string): number | null => {
  const m = /(?:^|-)ep([1-4])(?:-|$)/.exec(slug);
  return m ? Number(m[1]) : null;
};

export interface QuizLink { code: string; kind: "pre_test" | "post_test"; open: boolean }
export interface EpisodeQuiz { episode: number; pre: QuizLink | null; post: QuizLink | null }

export const isOpenNow = (t: { opensAt: Date | null; closesAt: Date | null }, now = new Date()) =>
  !!t.opensAt && t.opensAt <= now && (!t.closesAt || t.closesAt > now);

/** The pre/post pair for one Bootcamp episode (keys bootcamp-ep1-pre ... bootcamp-ep4-post). */
export async function getEpisodeQuiz(episode: number, now = new Date()): Promise<EpisodeQuiz> {
  const rows = await prisma.test.findMany({
    where: { key: { in: [`bootcamp-ep${episode}-pre`, `bootcamp-ep${episode}-post`] } },
    select: { key: true, code: true, kind: true, opensAt: true, closesAt: true },
  });
  const link = (suffix: "pre" | "post"): QuizLink | null => {
    const r = rows.find((x) => x.key === `bootcamp-ep${episode}-${suffix}`);
    return r?.code ? { code: r.code, kind: suffix === "pre" ? "pre_test" : "post_test", open: isOpenNow(r, now) } : null;
  };
  return { episode, pre: link("pre"), post: link("post") };
}

/** The series shows on the home page while the Bootcamp is running: in its date range, or with an episode test open. */
export async function bootcampRunning(now = new Date()): Promise<boolean> {
  const ev = await prisma.event.findUnique({ where: { slug: BOOTCAMP_EVENT_SLUG }, select: { status: true, comingSoon: true, startDate: true, endDate: true } });
  if (!ev || ev.status === "archived") return false;
  if (!ev.comingSoon && ev.startDate && ev.startDate <= now && (!ev.endDate || ev.endDate >= now)) return true;
  const open = await prisma.test.findFirst({ where: { key: { startsWith: "bootcamp-ep" }, opensAt: { lte: now }, OR: [{ closesAt: null }, { closesAt: { gt: now } }] }, select: { id: true } });
  return !!open;
}
