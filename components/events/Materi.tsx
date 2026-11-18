import Link from "next/link";
import { getSeriesParts, BOOTCAMP_SERIES, episodeFromSlug } from "@/lib/blog-series";

/** "Materi" on the Bootcamp page: one link per article in the series, episodes marked. */
export default async function Materi({ tone = "light" }: { tone?: "light" | "ink" }) {
  const parts = await getSeriesParts(BOOTCAMP_SERIES).catch(() => []);
  if (parts.length === 0) return null;
  return (
    <section aria-labelledby="materi">
      <h2 id="materi" className={`font-display text-xl font-bold ${tone === "ink" ? "text-ink" : "text-slate-900"}`}>Materi</h2>
      <p className="mt-2 text-sm text-slate-600">Bacaan untuk menyiapkan proposalmu. Satu artikel untuk tiap episode, plus panduan dan dua artikel pendamping.</p>
      <ol className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {parts.map((p, i) => {
          const ep = episodeFromSlug(p.slug);
          return (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="flex min-h-14 items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{i + 1}</span>
                <span className="min-w-0 flex-1 font-medium text-slate-900">{p.title}</span>
                {ep && <span className="label-mono shrink-0 rounded-md bg-mint-100 px-2 py-0.5 text-mint-800">Episode {ep}</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
