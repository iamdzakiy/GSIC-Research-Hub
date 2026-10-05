"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyLinkButton({ url, label }: { url: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy link to ${label}`}
      title="Copy link"
      onClick={async () => { try { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 1800); } catch { /* blocked */ } }}
      className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      {ok ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
