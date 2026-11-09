import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Section header: mono kicker, display title, optional "see all" link. */
export default function SectionHead({ kicker, title, href, linkLabel = "See all", id }: { kicker?: string; title: string; href?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {kicker && <p className="label-mono text-brand-700">{kicker}</p>}
        <h2 id={id} className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
          {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
