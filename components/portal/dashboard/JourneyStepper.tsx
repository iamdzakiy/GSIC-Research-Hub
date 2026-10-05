import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RaporEvent } from "@/lib/scoring";

const STEPS = ["Registered", "Pre-test", "Event", "Post-test", "Report card"] as const;

/** 0-based index of the current (next-to-do) step. */
export const stepOf = (e: RaporEvent): number => (e.stage === "completed" ? 5 : e.stage === "pre_done" ? (new Date(e.startDate) > new Date() ? 2 : 3) : 1);

export default function JourneyStepper({ ev }: { ev: RaporEvent }) {
  const cur = stepOf(ev);
  const href = ev.type === "sandbox" ? "/events/sandbox" : "/events/pkm-bootcamp";
  const hint = ["", "Take the pre-test", "Attend the event", "Take the post-test", "Report card ready"][cur] || "Report card ready";
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{ev.title}</h3>
        <Link href={href} className="text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">{hint} →</Link>
      </div>
      <ol className="mt-5 grid grid-cols-5 gap-1" aria-label={`Progress for ${ev.title}`}>
        {STEPS.map((s, i) => {
          const done = i < cur, now = i === cur;
          return (
            <li key={s} className="relative flex flex-col items-center text-center" aria-current={now ? "step" : undefined}>
              {i > 0 && <span aria-hidden="true" className={cn("absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2", i <= cur ? "bg-mint" : "bg-slate-200")} />}
              <span className={cn("relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold", done ? "border-mint bg-mint text-navy" : now ? "border-brand-600 bg-white text-brand-700 ring-4 ring-brand-100" : "border-slate-200 bg-white text-slate-400")}>
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span className={cn("mt-1.5 text-[11px] font-medium leading-tight", now ? "text-brand-700" : done ? "text-slate-700" : "text-slate-400")}>{s}</span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
