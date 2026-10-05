"use client";

import { useEffect, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUrlParams } from "@/components/portal/useUrlParams";
import { BENEFIT_CATEGORIES, LEVELS, SCOPE_LABEL, STATUS_LABEL } from "@/lib/opportunity-status";
import { FUNDING_SHORT, MODE_SHORT } from "@/lib/opportunity-config";
import type { FacetCounts } from "@/lib/opportunity-sort";
import type { OpportunityFilters } from "@/lib/opportunity-query";

type Key = "level" | "scope" | "benefit" | "funding" | "mode" | "status";

interface Group {
  key: Key;
  title: string;
  options: { value: string; label: string }[];
}

const GROUPS: Group[] = [
  { key: "level", title: "Jenjang", options: LEVELS.map((l) => ({ value: l, label: l })) },
  {
    key: "scope",
    title: "Kategori",
    options: ["internal", "external"].map((s) => ({ value: s, label: SCOPE_LABEL[s]! })),
  },
  {
    key: "status",
    title: "Status",
    options: (["open", "closing", "closed"] as const).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
  },
  { key: "funding", title: "Jenis Pendanaan", options: Object.entries(FUNDING_SHORT).map(([value, label]) => ({ value, label })) },
  { key: "mode", title: "Format", options: Object.entries(MODE_SHORT).map(([value, label]) => ({ value, label })) },
  { key: "benefit", title: "Benefit", options: BENEFIT_CATEGORIES.map((b) => ({ value: b, label: b })) },
];

function CollapsibleGroup({
  group,
  selected,
  counts,
  onToggle,
  defaultOpen,
}: {
  group: Group;
  selected: string[];
  counts: Record<string, number>;
  onToggle: (key: Key, value: string) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || selected.length > 0);
  const panelId = `filter-${group.key}`;
  return (
    <fieldset className="border-b border-slate-200 py-4 first:pt-0 last:border-b-0">
      <legend className="sr-only">{group.title}</legend>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-900"
      >
        <span>
          {group.title}
          {selected.length > 0 && (
            <span className="ml-2 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{selected.length}</span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <ul id={panelId} className="mt-3 space-y-1">
          {group.options.map((o) => {
            const checked = selected.includes(o.value);
            const count = counts[o.value] ?? 0;
            const disabled = count === 0 && !checked;
            const id = `${panelId}-${o.value}`;
            return (
              <li key={o.value}>
                <label
                  htmlFor={id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 text-sm hover:bg-slate-50",
                    disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                  )}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggle(group.key, o.value)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                  />
                  <span className="flex-1 text-slate-700">{o.label}</span>
                  <span className="text-xs tabular-nums text-slate-400">{count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}

function Panel({ filters, facets }: { filters: OpportunityFilters; facets: FacetCounts }) {
  const { update } = useUrlParams();
  const active =
    filters.level.length + filters.scope.length + filters.benefit.length + filters.funding.length + filters.mode.length + filters.status.length;

  const toggle = (key: Key, value: string) =>
    update((p) => {
      const current = p.getAll(key);
      p.delete(key);
      (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]).forEach((v) => p.append(key, v));
    });

  const reset = () =>
    update((p) => {
      (["level", "scope", "benefit", "funding", "mode", "status"] as const).forEach((k) => p.delete(k));
    });

  return (
    <>
      <div className="mb-4 flex items-center justify-between border-b border-slate-300 pb-3">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">Filter Peluang</h2>
        {active > 0 && (
          <button type="button" onClick={reset} className="text-xs font-medium text-brand-700 hover:underline">
            Reset ({active})
          </button>
        )}
      </div>
      {GROUPS.map((g, i) => (
        <CollapsibleGroup
          key={g.key}
          group={g}
          selected={filters[g.key] as string[]}
          counts={facets[g.key]}
          onToggle={toggle}
          defaultOpen={i < 3}
        />
      ))}
    </>
  );
}

export default function FilterSidebar({ filters, facets, total }: { filters: OpportunityFilters; facets: FacetCounts; total: number }) {
  const [drawer, setDrawer] = useState(false);
  const active =
    filters.level.length + filters.scope.length + filters.benefit.length + filters.funding.length + filters.mode.length + filters.status.length;

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  return (
    <>
      {/* Desktop */}
      <aside aria-label="Filter peluang" className="sticky top-24 hidden self-start lg:block">
        <Panel filters={filters} facets={facets} />
      </aside>

      {/* Mobile trigger + drawer */}
      <button
        type="button"
        onClick={() => setDrawer(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filter
        {active > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{active}</span>}
      </button>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter peluang">
          <button type="button" aria-label="Tutup filter" className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-end border-b border-slate-200 px-4 py-3">
              <button type="button" onClick={() => setDrawer(false)} aria-label="Tutup" className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <Panel filters={filters} facets={facets} />
            </div>
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="h-11 w-full rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700"
              >
                Tampilkan {total} hasil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
