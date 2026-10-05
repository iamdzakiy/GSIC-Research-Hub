import "server-only";
// Content may be TipTap HTML (admin editor) or Markdown (seeded / imported); both become sanitised HTML.
// sanitize-html is pure JS (htmlparser2) so it loads fine in serverless runtimes — unlike jsdom-based sanitisers.
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const looksLikeHtml = (s: string) => /^\s*<[a-z!]/i.test(s);

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img", "h1", "h2", "u", "s", "mark", "pre", "code", "span", "figure", "figcaption", "details", "summary",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "hr", "sup", "sub",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    code: ["class"], pre: ["class"], span: ["class"],
    th: ["colspan", "rowspan", "align"], td: ["colspan", "rowspan", "align"],
    ol: ["start"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowedClasses: { code: [/^language-[\w-]+$/, /^hljs.*$/], pre: [/^language-[\w-]+$/, /^hljs.*$/], span: [/^hljs.*$/] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const external = /^https?:/i.test(attribs.href ?? "");
      return { tagName, attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs };
    },
  },
};

export function renderContentToHtml(content: string): string {
  const raw = looksLikeHtml(content || "") ? content : (marked.parse(content || "", { async: false, gfm: true }) as string);
  return sanitizeHtml(raw, OPTIONS);
}
