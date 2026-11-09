import Link from "next/link";
import { FileText, Users } from "lucide-react";
import Countdown from "@/components/hub/Countdown";
import DayPlate from "@/components/hub/DayPlate";
import { categoryShort } from "@/lib/competitions";
import type { CompetitionRow } from "@/lib/competition-data";

const team = (min: number | null, max: number | null) => (max === 1 ? "Individual" : min && max ? (min === max ? `Team of ${max}` : `Teams of ${min}–${max}`) : max ? `Up to ${max} people` : null);

/** Competition card: what people check first. Category, title, theme, when registration closes, guidebook, partners. */
export default function CompetitionCard({ c }: { c: CompetitionRow }) {
  const size = team(c.teamSizeMin, c.teamSizeMax);
  return (
    <article className="lift group relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-navy">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {c.category ? <span className="label-mono inline-block rounded bg-navy px-1.5 py-0.5 text-mint">{categoryShort(c.category)}</span> : null}
          <h3 className="mt-3 font-display text-[18px] font-semibold leading-snug tracking-tight text-ink">
            <Link href={`/competitions/${c.slug}`} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none">{c.title}</Link>
          </h3>
        </div>
        <DayPlate deadline={c.deadline} />
      </div>
      <p className="mt-0.5 text-sm text-ink-3">{c.organizer}</p>
      {c.theme && <p className="mt-3 line-clamp-2 border-l-2 border-mint-400 pl-3 text-sm leading-6 text-ink-2">{c.theme}</p>}
      <div className="mt-auto pt-4">
        <Countdown deadline={c.deadline} className="block text-sm" />
        {(size || c.registrationFee) && <p className="mt-1 text-xs text-ink-3">{[size, c.registrationFee].filter(Boolean).join(" · ")}</p>}
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {c.guidebookUrl && (
            <a href={c.guidebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-ink-2 hover:bg-paper-2"><FileText className="h-3.5 w-3.5" aria-hidden="true" /> Guidebook</a>
          )}
          <Link href={`/partners?competition=${encodeURIComponent(c.slug)}`} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-ink-2 hover:bg-paper-2">
            <Users className="h-3.5 w-3.5" aria-hidden="true" /> Seeking partner{c.partnerCount ? <span className="tnum rounded bg-mint-100 px-1.5 text-[11px] font-semibold text-mint-900">{c.partnerCount}</span> : null}
          </Link>
        </div>
      </div>
    </article>
  );
}
