export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-56 animate-pulse rounded-md bg-slate-200" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
      </div>
    </div>
  );
}
