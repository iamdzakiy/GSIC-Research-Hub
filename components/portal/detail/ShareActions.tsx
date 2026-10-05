"use client";

import { useState } from "react";
import { CalendarPlus, Check, Link2, Share2 } from "lucide-react";

export default function ShareActions({ title, icsHref }: { title: string; icsHref: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => (typeof window !== "undefined" ? window.location.href.split("#")[0]! : "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — no-op */ }
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title, url: url() }); return; } catch { return; } }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`, "_blank", "noopener,noreferrer");
  };

  const btn = "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600";
  return (
    <div className="grid grid-cols-3 gap-2">
      <button type="button" onClick={copy} className={btn} aria-live="polite">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
        {copied ? "Tersalin" : "Salin"}
      </button>
      <button type="button" onClick={share} className={btn}><Share2 className="h-3.5 w-3.5" aria-hidden="true" />Bagikan</button>
      <a href={icsHref} className={btn} download><CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />Kalender</a>
    </div>
  );
}
