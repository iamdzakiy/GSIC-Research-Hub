import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  page: number;
  pageCount: number;
  basePath: string;
  /** Current params WITHOUT `page` (as URLSearchParams string). */
  query: string;
}

function href(basePath: string, query: string, page: number) {
  const p = new URLSearchParams(query);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function windowed(page: number, count: number): (number | "…")[] {
  const set = new Set([1, count, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1]! > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export default function Pagination({ page, pageCount, basePath, query }: Props) {
  if (pageCount <= 1) return null;
  const item = "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm";
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(basePath, query, page - 1)} aria-label="Previous page" className={cn(item, "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {windowed(page, pageCount).map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-slate-400">…</span>
        ) : (
          <Link
            key={n}
            href={href(basePath, query, n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(item, n === page ? "border-brand-600 bg-brand-600 font-medium text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}
          >
            {n}
          </Link>
        )
      )}
      {page < pageCount && (
        <Link href={href(basePath, query, page + 1)} aria-label="Next page" className={cn(item, "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
