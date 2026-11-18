import "server-only";
// Content may be TipTap HTML (admin editor) or Markdown (seeded / imported); both become sanitised HTML.
// sanitize-html is pure JS (htmlparser2) so it loads fine in serverless runtimes — unlike jsdom-based sanitisers.
// Markdown extras: figures with captions, [!TIP]/[!NOTE]/[!WARNING] callouts, tickable checklists, scrollable
// tables and heading anchors. The renderer only emits class names and ids; the sanitiser allow-list below is what
// decides what survives, and it stays strict (no inputs, no scripts, no inline styles, no data-* except data-task).
import { readFileSync } from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";

const looksLikeHtml = (s: string) => /^\s*<[a-z!]/i.test(s);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface TocItem { id: string; text: string; level: 2 | 3 }
export interface RenderedArticle { html: string; toc: TocItem[] }
export interface RenderOptions { lang?: string }

const CALLOUT_TITLES: Record<string, Record<string, string>> = {
  id: { tip: "Tips", note: "Catatan", warning: "Peringatan" },
  en: { tip: "Tip", note: "Note", warning: "Warning" },
};

export function slugifyHeading(text: string): string {
  const s = text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "bagian";
}

/** Intrinsic size of a local /blog/... SVG, read from its viewBox, so the browser can reserve space before it loads. */
function localImageSize(src: string): { w: number; h: number } | null {
  if (!/^\/blog\/[\w./-]+\.svg$/i.test(src) || src.includes("..")) return null;
  try {
    const svg = readFileSync(path.join(process.cwd(), "public", src), "utf8").slice(0, 2000);
    const m = svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
    return m ? { w: Math.round(Number(m[1])), h: Math.round(Number(m[2])) } : null;
  } catch { return null; }
}

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img", "h1", "h2", "u", "s", "mark", "pre", "code", "span", "figure", "figcaption", "details", "summary", "aside",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "hr", "sup", "sub",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "title", "class"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    code: ["class"], pre: ["class"], span: ["class"], figure: ["class"], aside: ["class"], div: ["class"], p: ["class"], ul: ["class"], ol: ["class", "start"], li: ["class", "data-task"],
    h2: ["id"], h3: ["id"], h4: ["id"],
    th: ["colspan", "rowspan", "align"], td: ["colspan", "rowspan", "align"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowedClasses: {
    code: [/^language-[\w-]+$/, /^hljs.*$/], pre: [/^language-[\w-]+$/, /^hljs.*$/], span: [/^hljs.*$/, "task-box", "task-text"],
    a: ["h-anchor"], figure: ["fig"], aside: ["callout", "callout-tip", "callout-note", "callout-warning"], p: ["callout-title"],
    div: ["table-wrap"], ul: ["task-list"], li: ["task"],
  },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const external = /^https?:/i.test(attribs.href ?? "");
      return { tagName, attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs };
    },
  },
};

function markdownToHtml(content: string, lang: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  let taskNo = 0;
  const titles = CALLOUT_TITLES[lang === "id" ? "id" : "en"];
  const md = new Marked({ gfm: true, async: false });
  md.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const text = inner.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();
        let id = slugifyHeading(text);
        const n = used.get(id) ?? 0; used.set(id, n + 1);
        if (n) id = `${id}-${n + 1}`;
        if (depth === 2 || depth === 3) toc.push({ id, text, level: depth });
        if (depth < 2 || depth > 4) return `<h${depth}>${inner}</h${depth}>\n`;
        return `<h${depth} id="${id}">${inner}<a class="h-anchor" href="#${id}" aria-label="Copy link to this section">#</a></h${depth}>\n`;
      },
      image({ href, title, text }) {
        const size = localImageSize(href);
        const dims = size ? ` width="${size.w}" height="${size.h}"` : "";
        const cap = title ? `<figcaption>${esc(title)}</figcaption>` : "";
        return `<figure class="fig"><img src="${esc(href)}" alt="${esc(text)}"${dims} loading="lazy">${cap}</figure>`;
      },
      blockquote({ tokens }) {
        const body = this.parser.parse(tokens);
        const m = body.match(/^\s*<p>\[!(TIP|NOTE|WARNING)\]\s*(?:<br\s*\/?>\s*)?/i);
        if (!m) return `<blockquote>\n${body}</blockquote>\n`;
        const kind = m[1].toLowerCase();
        const rest = body.slice(m[0].length).replace(/^<\/p>\s*/, "<p>").replace(/^<p><\/p>/, "");
        return `<aside class="callout callout-${kind}"><p class="callout-title">${titles[kind]}</p>${rest.startsWith("<p>") ? rest : `<p>${rest}`}</aside>\n`;
      },
      list(token) {
        const tag = token.ordered ? "ol" : "ul";
        const start = token.ordered && token.start !== 1 && token.start !== "" ? ` start="${token.start}"` : "";
        const tasks = token.items.some((i) => i.task);
        let body = "";
        for (const item of token.items) body += this.listitem(item);
        return `<${tag}${start}${tasks ? ' class="task-list"' : ""}>\n${body}</${tag}>\n`;
      },
      listitem(item) {
        const inner = this.parser.parse(item.tokens);
        if (!item.task) return `<li>${inner}</li>\n`;
        taskNo += 1;
        return `<li class="task" data-task="${taskNo}"><span class="task-box"></span><span class="task-text">${inner}</span></li>\n`;
      },
    },
  });
  let html = md.parse(content, { async: false }) as string;
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
  return { html, toc };
}

/** Sanitised HTML plus the table of contents (h2/h3). Markdown only; TipTap HTML gets no extras and an empty ToC. */
export function renderArticle(content: string, opts: RenderOptions = {}): RenderedArticle {
  if (looksLikeHtml(content || "")) return { html: sanitizeHtml(content, OPTIONS), toc: [] };
  const { html, toc } = markdownToHtml(content || "", opts.lang ?? "en");
  return { html: sanitizeHtml(html, OPTIONS), toc };
}

export function renderContentToHtml(content: string, opts: RenderOptions = {}): string {
  return renderArticle(content, opts).html;
}
