"use client";
// Big day counter used on cards and rows. Red under 3 days, muted when closed.
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export default function DayPlate({ deadline, className, dark = false }: { deadline: string | Date; className?: string; dark?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const ms = new Date(deadline).getTime() - (now ?? new Date(deadline).getTime() - 5 * 86_400_000);
  const closed = ms <= 0;
  const days = Math.max(0, Math.ceil(ms / 86_400_000));
  const hot = !closed && ms < 3 * 86_400_000;
  return (
    <div className={cn("flex min-w-[3.75rem] flex-col items-center justify-center rounded-lg border px-2 py-1.5 text-center",
      closed ? "border-slate-200 text-ink-3" : hot ? "border-rose-300 bg-rose-50 text-rose-700" : dark ? "border-white/15 text-white" : "border-slate-300 text-ink", className)} aria-label={closed ? "Closed" : `${days} days left`}>
      <span className="tnum font-display text-2xl font-bold leading-none">{closed ? "—" : days}</span>
      <span className="label-mono mt-1 text-[9px] opacity-70">{closed ? "closed" : days === 1 ? "day left" : "days left"}</span>
    </div>
  );
}
