import { SearchX } from "lucide-react";

export default function EmptyState({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <SearchX className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
      <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
