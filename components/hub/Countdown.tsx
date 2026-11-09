"use client";
// Registration countdown in WIB. Ticks every 30 s without shifting layout (tabular figures).
import { useEffect, useState } from "react";
import { closesLabel } from "@/lib/competitions";
import { cn } from "@/lib/cn";

export default function Countdown({ deadline, className }: { deadline: string | Date; className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const c = closesLabel(deadline, now ?? new Date(0));
  if (!now) return <span className={cn("tnum text-ink-3", className)}>{closesLabel(deadline, new Date(deadline)).text.replace(/^Closed · /, "Closes ")}</span>;
  return <span className={cn("tnum", c.closed ? "text-ink-3" : c.urgent ? "font-semibold text-rose-700" : "text-ink-2", className)}>{c.text}</span>;
}
