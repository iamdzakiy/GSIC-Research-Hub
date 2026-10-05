import { Check, ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import type { FactGroup } from "@/lib/opportunity-config";

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <h2 id={`${id}-h`} className="mb-4 border-b border-slate-200 pb-2.5 text-xl font-semibold tracking-tight text-slate-900 font-heading">{title}</h2>
      {children}
    </section>
  );
}

export function QuickOverview({ groups }: { groups: FactGroup[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {groups.map((g, gi) => (
        <div key={g.title} className={cn(gi > 0 && "border-t border-slate-200")}>
          <h3 className="bg-cream-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-5">{g.title}</h3>
          <dl className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
            {g.facts.map((f, i) => (
              <div key={f.label} className={cn("px-4 py-3 sm:px-5", i >= 2 && "sm:border-t sm:border-slate-100", i % 2 === 1 && "sm:border-l sm:border-slate-100")}>
                <dt className="text-xs text-slate-500">{f.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export function CriteriaList({ title, items, tone }: { title: string; items: string[]; tone: "required" | "bonus" | "basic" }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="space-y-2">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-6 text-slate-700">
            <span className={cn("mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", tone === "bonus" ? "bg-cream-200 text-cream-700" : "bg-mint-100 text-mint-700")} aria-hidden="true">
              <Check className="h-3 w-3" />
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Steps({ steps }: { steps: { title: string; description?: string }[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-slate-200" aria-hidden="true" />}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-sm font-semibold text-brand-700">{i + 1}</span>
          <div className="pt-1">
            <p className="text-sm font-semibold text-slate-900">{s.title}</p>
            {s.description && <p className="mt-1 text-sm leading-6 text-slate-600">{s.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DocChecklist({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((d, i) => (
        <li key={i} className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700">
          <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          {d}
        </li>
      ))}
    </ul>
  );
}

export function Timeline({ rows }: { rows: { phase: string; date?: string; description?: string }[] }) {
  return (
    <ol className="space-y-5 border-l border-slate-200 pl-5">
      {rows.map((t, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-brand-600 ring-4 ring-white" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-900">{t.phase}</p>
          {t.date && <p className="text-xs font-medium text-brand-700">{t.date}</p>}
          {t.description && <p className="mt-1 text-sm leading-6 text-slate-600">{t.description}</p>}
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {items.map((f, i) => (
        <details key={i} className="group px-4 py-3.5 sm:px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-900 [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="mt-2.5 whitespace-pre-line text-sm leading-6 text-slate-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function DeadlineMeter({ openDate, deadline, now = new Date() }: { openDate: Date | null; deadline: Date; now?: Date }) {
  if (!openDate) return null;
  const total = deadline.getTime() - openDate.getTime();
  const pct = total <= 0 ? 100 : Math.min(100, Math.max(0, ((now.getTime() - openDate.getTime()) / total) * 100));
  return (
    <div role="img" aria-label={`${Math.round(pct)}% of the application period has passed`} className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={cn("h-full rounded-full", pct > 85 ? "bg-rose-500" : "bg-brand-600")} style={{ width: `${pct}%` }} />
    </div>
  );
}
