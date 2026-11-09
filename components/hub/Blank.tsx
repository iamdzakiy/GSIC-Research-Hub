// Designed empty state: the campus silhouette, one sentence of why, and one next action.
import CampusSilhouette from "@/components/hub/CampusSilhouette";

export default function Blank({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 pb-0 pt-10 text-center">
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {hint && <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-ink-3">{hint}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
      <CampusSilhouette className="mx-auto mt-8 max-w-xl text-slate-300" strokeWidth={1.2} />
    </div>
  );
}
