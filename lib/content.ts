// ============================================================
// Content helpers shared by blog + opportunity detail pages.
// Content may be TipTap HTML (admin editor) or Markdown (seeded / imported);
// both are normalised to sanitised HTML.
// ============================================================
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

const looksLikeHtml = (s: string) => /^\s*<[a-z!]/i.test(s);

export function renderContentToHtml(content: string): string {
  const raw = looksLikeHtml(content || "") ? content : (marked.parse(content || "", { async: false, gfm: true }) as string);
  const clean = DOMPurify.sanitize(raw, {
    ADD_ATTR: ["target", "rel"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|data:image\/(?:png|jpe?g|gif|webp);base64,|[/#])/i,
  });
  // Force external links to be safe.
  return clean.replace(/<a\s+([^>]*href="https?:[^"]*"[^>]*)>/gi, (m, attrs: string) =>
    /rel=/.test(attrs) ? m : `<a ${attrs} target="_blank" rel="noopener noreferrer">`
  );
}

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
