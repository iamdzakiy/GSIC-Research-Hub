import Link from "next/link";
import { cn } from "@/lib/cn";
import { OPP_TYPE_ORDER, TYPE_CONFIG } from "@/lib/opportunity-config";

interface Props {
  active: string; // "" = all
  /** Current query string without `type` and `page`. */
  query: string;
  counts: { all: number; byType: Record<string, number> };
  basePath?: string;
}

/** Category tabs (links, not state): /opportunities?type=career … */
export default function TypeTabs({ active, query, counts, basePath = "/opportunities" }: Props) {
  const href = (type: string) => {
    const p = new URLSearchParams(query);
    if (type) p.set("type", type);
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const tabs = [{ key: "", label: "All", count: counts.all }, ...OPP_TYPE_ORDER.map((t) => ({ key: t, label: TYPE_CONFIG[t].plural, count: counts.byType[t] ?? 0 }))];
  return (
    <nav aria-label="Opportunity categories" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-slate-200">
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <li key={t.key || "all"}>
              <Link
                href={href(t.key)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  on ? "border-brand-600 text-brand-700" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
                )}
              >
                {t.label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-xs tabular-nums", on ? "bg-mint-100 text-mint-800" : "bg-slate-100 text-slate-500")}>{t.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
