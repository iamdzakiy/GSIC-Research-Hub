import Link from "next/link";
import { CalendarDays, GraduationCap, MapPin, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import StatusBadge from "@/components/portal/StatusBadge";
import BenefitPill from "@/components/portal/BenefitPill";
import { SCOPE_LABEL, daysLeft, formatPeriod } from "@/lib/opportunity-status";
import { FUNDING_SHORT, MODE_SHORT, formatPlace, typeLabel } from "@/lib/opportunity-config";
import type { ListingItem } from "@/lib/opportunity-sort";

function initials(name: string): string {
  return name.replace(/\(.*?\)/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

function Meta({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export default function ListingCard({ item, compact = false }: { item: ListingItem; compact?: boolean }) {
  const closed = item.status === "closed";
  const remaining = daysLeft(item.deadline);
  const benefits = (item.benefitCategories.length ? item.benefitCategories : item.benefits).slice(0, 4);
  const href = `/opportunities/${item.slug || item.id}`;
  const place = formatPlace(item.city, item.country) ?? (item.attendanceMode ? MODE_SHORT[item.attendanceMode] : null);

  return (
    <article
      className={cn(
        "grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 md:grid-cols-[1fr_15rem]",
        "transition-colors hover:border-slate-300",
        closed && "bg-slate-50/70 opacity-75 grayscale-[40%]"
      )}
    >
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <span className="rounded-md bg-brand-50 px-2 py-1 text-brand-700">{typeLabel(item.type)}</span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{SCOPE_LABEL[item.scope] ?? item.scope}</span>
          <StatusBadge status={item.status} className="ml-auto md:hidden" />
        </div>
        <h2 className="text-lg font-semibold leading-snug tracking-tight text-slate-900 font-heading">
          <Link href={href} className="hover:text-brand-700 focus-visible:underline focus-visible:outline-none">{item.title}</Link>
        </h2>

        <div className="mt-2.5 flex items-center gap-2 text-sm">
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700 ring-1 ring-brand-100">{initials(item.organizer)}</span>
          <span className="truncate font-medium text-brand-700">{item.organizer}</span>
        </div>

        {!compact && item.summary && <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.summary}</p>}

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
          {item.levels.length > 0 && <Meta icon={GraduationCap}>{item.levels.join(", ")}</Meta>}
          {place && <Meta icon={MapPin}>{place}{item.attendanceMode && formatPlace(item.city, item.country) ? ` · ${MODE_SHORT[item.attendanceMode]}` : ""}</Meta>}
          {item.fundingType && <Meta icon={Wallet}>{FUNDING_SHORT[item.fundingType]}{item.fundingAmount ? ` · ${item.fundingAmount}` : ""}</Meta>}
        </ul>

        {!compact && benefits.length > 0 && (
          <div className="mt-4">
            <h3 className="sr-only">Benefit</h3>
            <ul className="flex flex-wrap gap-2">{benefits.map((b) => <BenefitPill key={b}>{b}</BenefitPill>)}</ul>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
        <StatusBadge status={item.status} className="hidden self-start md:inline-flex" />
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Application period</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{formatPeriod(item.openDate, item.deadline)}</div>
          {!closed && item.status !== "upcoming" && (
            <div className={cn("mt-0.5 text-xs", item.status === "closing" ? "font-medium text-rose-600" : "text-slate-500")}>
              {remaining <= 0 ? "Ends today" : `${remaining} ${remaining === 1 ? "day" : "days"} left`}
            </div>
          )}
        </div>
        {item.quota != null && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><Users className="h-3.5 w-3.5" aria-hidden="true" /> Places available</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{item.quota.toLocaleString("en-GB")}</div>
          </div>
        )}
        <Link
          href={href}
          className={cn(
            "mt-auto inline-flex h-10 items-center justify-center self-end rounded-lg px-5 text-sm font-medium w-full md:w-auto",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
            closed ? "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100" : "bg-brand-600 text-white hover:bg-brand-700"
          )}
        >
          View details
        </Link>
      </div>
    </article>
  );
}
