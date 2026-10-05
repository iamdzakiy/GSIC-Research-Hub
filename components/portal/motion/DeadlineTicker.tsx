import Link from "next/link";

export interface TickerItem { slug: string; title: string; organizer: string; days: number }

/** Slow horizontal ticker of closing deadlines. CSS-only; pauses on hover; static and scrollable under reduced motion. */
export default function DeadlineTicker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;
  const loop = items.length < 6 ? [...items, ...items, ...items] : [...items, ...items];
  return (
    <div className="gsic-tick overflow-hidden border-y border-white/10 bg-navy-800 py-2.5 text-sm" aria-label="Deadlines closing soon">
      <style>{`@keyframes gsic-tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.gsic-tick ul{animation:gsic-tick ${Math.max(30, loop.length * 5)}s linear infinite}.gsic-tick:hover ul{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.gsic-tick ul{animation:none}.gsic-tick{overflow-x:auto}}`}</style>
      <ul className="flex w-max items-center gap-10 whitespace-nowrap px-4">
        {loop.map((t, i) => (
          <li key={`${t.slug}-${i}`} aria-hidden={i >= items.length ? true : undefined}>
            <Link href={`/opportunities/${t.slug}`} tabIndex={i >= items.length ? -1 : 0} className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
              <span className="rounded bg-cream px-1.5 py-0.5 text-xs font-semibold text-navy">{t.days <= 0 ? "Today" : `${t.days}d`}</span>
              <span className="font-medium text-white">{t.title}</span>
              <span className="text-slate-400">{t.organizer}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
