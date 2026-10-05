import Link from "next/link";
import { cn } from "@/lib/cn";

interface Props {
  /** Raw tag; a leading "#" is stripped and re-added for display. */
  tag: string;
  /** Link to the blog index filtered by this tag. Omit for a static pill. */
  href?: string;
  active?: boolean;
  count?: number;
  /** Show the leading `#` (default true). */
  hash?: boolean;
  className?: string;
}

const base =
  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium leading-none transition-colors";

export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#+/, "").replace(/\s+/g, "");
}

export default function TagBadge({ tag, href, active, count, hash = true, className }: Props) {
  const label = hash ? `#${normalizeTag(tag)}` : tag;
  const tone = active
    ? "border-brand-600 bg-brand-600 text-white"
    : "border-slate-200 bg-white text-slate-600" + (href ? " hover:border-cream-300 hover:bg-cream-100 hover:text-slate-900" : "");
  const content = (
    <>
      {label}
      {typeof count === "number" && (
        <span className={cn("tabular-nums", active ? "text-white/80" : "text-slate-400")}>{count}</span>
      )}
    </>
  );
  if (!href) return <span className={cn(base, tone, className)}>{content}</span>;
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className={cn(base, tone, className)}>
      {content}
    </Link>
  );
}
