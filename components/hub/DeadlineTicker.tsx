import Link from "next/link";

/** Slow marquee of what closes next. Pure CSS, pauses on hover, static under reduced motion. */
export default function DeadlineTicker({ items }: { items: { slug: string; title: string; days: number; cat?: string }[] }) {
  if (!items.length) return null;
  const row = items.map((i) => (
    <Link key={i.slug} href={`/competitions/${i.slug}`} className="flex shrink-0 items-center gap-3 px-6 text-sm text-slate-300 hover:text-white">
      <span className="label-mono text-mint">{i.days <= 0 ? "today" : `${i.days}d`}</span>
      <span className="font-medium">{i.title}</span>
      {i.cat && <span className="label-mono text-slate-500">{i.cat}</span>}
      <span aria-hidden="true" className="text-slate-600">/</span>
    </Link>
  ));
  return (
    <div className="overflow-hidden border-y border-white/10 bg-navy-800 py-3" aria-label="Closing soon">
      <div className="marquee" aria-hidden={false}>{row}{items.length < 8 ? row : null}{row}{items.length < 8 ? row : null}</div>
    </div>
  );
}
