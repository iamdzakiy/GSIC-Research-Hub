// ============================================================
// Content helpers shared by blog + opportunity detail pages.
// Pure text helpers: reading time, excerpt, date formatting.
// ============================================================
import { marked } from "marked";

// NOTE: HTML sanitising lives in lib/render-content.ts (sanitize-html, no jsdom). Keep THIS module free of
// heavy/DOM dependencies: it is imported by the home page and every card, and a module-load crash here is a site-wide 500.
const looksLikeHtml = (s: string) => /^\s*<[a-z!]/i.test(s);

export function stripToText(content: string): string {
  const html = looksLikeHtml(content || "") ? content : (marked.parse(content || "", { async: false }) as string);
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function readingTimeMinutes(content: string): number {
  const words = stripToText(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function excerptOf(post: { excerpt?: string | null; content: string }, max = 160): string {
  if (post.excerpt) return post.excerpt;
  const t = stripToText(post.content);
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

export function formatDateLong(d?: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}
