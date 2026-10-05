import { cn } from "@/lib/cn";
import { renderContentToHtml } from "@/lib/content";

/** Light-theme typography for sanitised article / rich-text content. */
export default function Prose({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-slate max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-headings:text-slate-900",
        "prose-p:leading-7 prose-a:text-brand-700 prose-a:underline-offset-2 hover:prose-a:text-brand-800",
        "prose-blockquote:border-l-brand-600 prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-slate-600",
        "prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-slate-800 prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:rounded-lg prose-pre:border prose-pre:border-slate-200 prose-pre:bg-slate-900",
        "prose-img:rounded-lg prose-img:border prose-img:border-slate-200",
        className
      )}
      dangerouslySetInnerHTML={{ __html: renderContentToHtml(content) }}
    />
  );
}
