import CampusSilhouette from "@/components/hub/CampusSilhouette";

/**
 * The one page header every GSIC Hub page shares: navy field, blueprint grid, the ITB silhouette drawing
 * itself along the bottom edge, a mono kicker, a large display title and an optional action row.
 * Wrap a word of `title` in <span className="outline-cream"> for the outlined emphasis.
 */
export default function PageHero({ kicker, title, children, actions, compact = false }: { kicker: string; title: React.ReactNode; children?: React.ReactNode; actions?: React.ReactNode; compact?: boolean }) {
  return (
    <header className="relative overflow-hidden bg-navy text-white">
      <div className="bp-grid-dark absolute inset-0" aria-hidden="true" />
      <CampusSilhouette draw className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-[1500px] text-brand-400/40" strokeWidth={1.2} />
      <div className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${compact ? "pb-14 pt-10" : "pb-20 pt-12 sm:pb-24 sm:pt-16"}`}>
        <div className="rise flex items-center gap-3">
          <span className="h-px w-8 bg-mint" aria-hidden="true" />
          <p className="label-mono text-mint">{kicker}</p>
        </div>
        <h1 className="rise mt-4 max-w-4xl font-display text-4xl font-bold leading-[0.98] tracking-[-0.03em] sm:text-6xl">{title}</h1>
        {children && <p className="rise mt-4 max-w-xl text-[15px] leading-7 text-slate-300">{children}</p>}
        {actions && <div className="rise mt-6 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
