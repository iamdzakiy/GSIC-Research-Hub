import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SeriesPart } from "@/lib/blog-series";

/** The article series as a band of covers in reading order. Used on the blog index and, while the Bootcamp runs, on the home page. */
export default function SeriesBand({ series, parts, dark = false, heading = "Read the series" }: { series: string; parts: SeriesPart[]; dark?: boolean; heading?: string }) {
  if (parts.length === 0) return null;
  return (
    <section aria-labelledby="series-band" className={`rounded-2xl border p-5 sm:p-8 ${dark ? "border-white/10 bg-navy-800 text-white" : "border-slate-200 bg-white"}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`label-mono ${dark ? "text-mint-400" : "text-brand-700"}`}>{series}</p>
          <h2 id="series-band" className={`mt-1.5 font-display text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>{heading}</h2>
          <p className={`mt-1 text-sm ${dark ? "text-white/70" : "text-slate-600"}`}>{parts.length} parts, in the order we suggest reading them. Articles are in Bahasa Indonesia.</p>
        </div>
        <Link href={`/blog/${parts[0].slug}`} className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold ${dark ? "text-mint-400 hover:text-white" : "text-brand-700 hover:text-brand-800"}`}>Start with part 1 <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <ol className="mt-6 grid grid-flow-col auto-cols-[70%] gap-4 overflow-x-auto pb-2 [scroll-snap-type:x_mandatory] sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {parts.map((p, i) => (
          <li key={p.slug} className="[scroll-snap-align:start]">
            <Link href={`/blog/${p.slug}`} className="group block focus-visible:outline-none">
              {p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImage} alt="" width={1600} height={900} loading="lazy" className={`aspect-[16/9] w-full rounded-lg border object-cover transition-transform duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-brand-600 motion-reduce:transition-none ${dark ? "border-white/10" : "border-slate-200"}`} />
              ) : (
                <div className="aspect-[16/9] w-full rounded-lg bg-brand-50" aria-hidden="true" />
              )}
              <p className={`label-mono mt-2 ${dark ? "text-white/60" : "text-slate-500"}`}>Part {i + 1}</p>
              <p lang="id" className={`mt-0.5 text-sm font-semibold leading-snug ${dark ? "text-white group-hover:text-mint-400" : "text-slate-900 group-hover:text-brand-700"}`}>{p.title}</p>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
