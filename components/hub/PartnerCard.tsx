// A Seeking Partner post as a card. Same anatomy everywhere: who, for what, which roles, by when.
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import Avatar from "@/components/hub/Avatar";
import Countdown from "@/components/hub/Countdown";
import { categoryShort } from "@/lib/competitions";
import { roleText } from "@/lib/partner-labels";
import type { PartnerPost } from "@/lib/partners";

export default function PartnerCard({ p, compact = false }: { p: PartnerPost; compact?: boolean }) {
  const lft = p.kind === "looking_for_team";
  return (
    <article className="lift relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <span className={`label-mono rounded px-1.5 py-0.5 ${lft ? "bg-cream-200 text-navy" : "bg-mint-100 text-navy"}`}>{lft ? "Looking for a team" : `Needs ${p.slots}`}</span>
        {p.category && <span className="label-mono text-ink-3">{categoryShort(p.category)}</span>}
      </div>
      <h3 className="mt-3 font-display text-[16px] font-semibold leading-snug text-ink">
        <Link href={`/partners/${p.id}`} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none">{p.title}</Link>
      </h3>
      <p className="mt-0.5 line-clamp-1 text-sm text-ink-3">{p.opportunity?.title ?? p.event?.title ?? p.competition}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={lft ? "Roles offered" : "Roles needed"}>
        {p.rolesNeeded.map((r) => <li key={r} className="rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">{roleText(r)}</li>)}
        {!compact && p.skillsNeeded.slice(0, 4).map((s) => <li key={s} className="rounded-md bg-paper-2 px-2 py-0.5 text-xs text-ink-2">{s}</li>)}
      </ul>
      {!compact && <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-2">{p.description}</p>}
      <div className="min-h-4 flex-1" />
      <div className="flex items-center gap-2.5 border-t border-slate-100 pt-3">
        <Avatar name={p.owner.name} src={p.owner.avatarUrl} size={28} />
        <div className="min-w-0 flex-1 text-xs">
          <p className="truncate font-medium text-ink">{p.owner.name ?? "Member"}</p>
          <p className="truncate text-ink-3">{[p.owner.major, p.commitment].filter(Boolean).join(" · ") || "ITB"}</p>
        </div>
        <div className="text-right text-xs">
          <Countdown deadline={p.deadline} className="block" />
          {p._count.applications > 0 && <span className="inline-flex items-center gap-1 text-ink-3"><MessageSquare className="h-3 w-3" aria-hidden="true" />{p._count.applications}</span>}
        </div>
      </div>
    </article>
  );
}
