"use client";

import { ArrowDownUp } from "lucide-react";
import { useUrlParams } from "@/components/portal/useUrlParams";

const OPTIONS = [
  { value: "deadline", label: "Deadline terdekat" },
  { value: "newest", label: "Terbaru" },
  { value: "quota", label: "Kuota terbanyak" },
];

export default function SortSelect({ value }: { value: string }) {
  const { update } = useUrlParams();
  return (
    <div className="relative sm:w-64">
      <label htmlFor="sort" className="sr-only">
        Urutkan berdasarkan
      </label>
      <ArrowDownUp className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <select
        id="sort"
        value={value}
        onChange={(e) =>
          update((p) => {
            if (e.target.value === "deadline") p.delete("sort");
            else p.set("sort", e.target.value);
          })
        }
        className="h-11 w-full appearance-none rounded-full border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-700 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
