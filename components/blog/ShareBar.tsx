"use client";
import { useEffect, useState } from "react";
import { Link2, MessageCircle, Printer } from "lucide-react";

/** Share to WhatsApp, copy the link, print. Uses the current address so it works on any host. */
export default function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [wa, setWa] = useState("https://wa.me/");
  useEffect(() => { setWa(`https://wa.me/?text=${encodeURIComponent(`${title} ${window.location.href.split("#")[0]}`)}`); }, [title]);
  const url = () => (typeof window === "undefined" ? "" : window.location.href.split("#")[0]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked: the link is still in the address bar */ }
  };
  const btn = "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600";
  return (
    <div className="print:hidden flex flex-wrap items-center gap-2" role="group" aria-label="Share this article">
      <a className={btn} target="_blank" rel="noopener noreferrer" href={wa}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" />WhatsApp
      </a>
      <button type="button" className={btn} onClick={copy}><Link2 className="h-4 w-4" aria-hidden="true" />{copied ? "Link copied" : "Copy link"}</button>
      <button type="button" className={btn} onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden="true" />Print</button>
      <span className="sr-only" aria-live="polite">{copied ? "Link copied" : ""}</span>
    </div>
  );
}
