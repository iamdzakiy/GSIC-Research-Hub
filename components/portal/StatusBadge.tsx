import { cn } from "@/lib/cn";
import { STATUS_LABEL, type DisplayStatus } from "@/lib/opportunity-status";

const STYLES: Record<DisplayStatus, { badge: string; dot: string }> = {
  open: { badge: "bg-mint-100 text-mint-800 border-mint-300", dot: "bg-mint-600" },
  closing: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  closed: { badge: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
  upcoming: { badge: "bg-cream-100 text-cream-700 border-cream-300", dot: "bg-cream-700" },
};

export default function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
        s.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}
