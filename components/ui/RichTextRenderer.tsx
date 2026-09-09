import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/cn";

/**
 * Renders sanitized rich-text HTML (output by TipTap) with Tailwind Typography
 * (`prose prose-invert`) styling tuned to the COMPFEST dark theme.
 *
 * Safe for both server- and client-side rendering via `isomorphic-dompurify`.
 */
export default function RichTextRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const sanitized = DOMPurify.sanitize(content || "", {
    ADD_ATTR: ["target", "rel"],
    ADD_TAGS: ["p", "br", "hr", "table", "thead", "tbody", "tr", "th", "td"],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|data:image\/(?:png|jpe?g|gif|webp);base64,)/i,
  });

  return (
    <div
      className={cn(
        "prose prose-invert max-w-none",
        "prose-headings:font-heading prose-headings:text-white prose-headings:tracking-tight",
        "prose-p:text-white/75 prose-p:leading-relaxed",
        "prose-a:text-[#60A5FA] prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-white prose-em:text-white/85",
        "prose-ul:marker:text-[#5CE3B6] prose-ol:marker:text-white/60",
        "prose-blockquote:border-l-[#5CE3B6] prose-blockquote:text-white/70 prose-blockquote:bg-white/[0.03] prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:rounded-r-lg",
        "prose-code:text-[#5CE3B6] prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-[#0B1120] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl",
        "prose-hr:border-white/10",
        "prose-img:rounded-xl prose-img:border prose-img:border-white/10",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}