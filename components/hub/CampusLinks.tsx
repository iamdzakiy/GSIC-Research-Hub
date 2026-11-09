import { ArrowUpRight } from "lucide-react";
import { CAMPUS_LINKS } from "@/lib/campus-links";

/** Quick access to the ITB systems, styled like a row of building plates. */
export default function CampusLinks() {
  return (
    <section aria-labelledby="campus-h" className="relative overflow-hidden rounded-2xl bg-navy p-5 text-white sm:p-6">
      <div className="bp-grid-dark absolute inset-0" aria-hidden="true" />
      <div className="relative">
        <h2 id="campus-h" className="label-mono text-mint">ITB essentials</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CAMPUS_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="lift group flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-mint/50">
                <span className="flex items-center justify-between font-display text-lg font-semibold">{l.label}<ArrowUpRight className="h-4 w-4 text-slate-400 transition-colors group-hover:text-mint" aria-hidden="true" /></span>
                <span className="mt-1 text-sm leading-5 text-slate-300">{l.desc}</span>
                <span className="label-mono mt-3 text-slate-500">{l.href.replace("https://", "")}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
