"use client";

import { Check, Copy, ExternalLink, FileText } from "lucide-react";
import { useState } from "react";
import { PREFERRED_ROLES, labelOf } from "@/lib/profile-options";

export interface Person {
  id: string; name: string; major: string | null; faculty: string | null; institution: string; linkedinUrl: string | null;
  preferredRole: string | null; hasCv: boolean; cvUrl: string | null; whatsapp: string | null;
}

export const roleLabel = (id?: string | null) => labelOf(PREFERRED_ROLES, id);
export const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const inputCls = (err?: string) =>
  `w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${err ? "border-rose-400 focus:ring-rose-500/20" : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20"}`;

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-white" />)}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="font-semibold text-slate-900">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      {message}
      {onRetry && <button type="button" onClick={onRetry} className="ml-2 font-medium underline">Try again</button>}
    </div>
  );
}

export function PersonLine({ p }: { p: Person }) {
  return (
    <div className="min-w-0 text-sm">
      <p className="font-semibold text-slate-900">{p.name}</p>
      <p className="text-slate-600">{[roleLabel(p.preferredRole), p.major, p.faculty].filter(Boolean).join(" · ")}</p>
      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {p.linkedinUrl && <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">LinkedIn <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
        {p.cvUrl && <a href={p.cvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"><FileText className="h-3 w-3" aria-hidden="true" /> CV</a>}
      </p>
    </div>
  );
}

const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, "").replace(/^0/, "62")}`;

/** Shown only after an accept: WhatsApp, the intro template from the sheet's guidelines, and the consent note. */
export function ContactReveal({ person, me, competition }: { person: Person; me: string; competition: string }) {
  const [copied, setCopied] = useState(false);
  const intro = `Hi, I hope this message finds you well. I'm ${me}, currently looking for collaborators for ${competition}. I found you through the GSIC Research Connection Matching Team and noticed you have experience in ${roleLabel(person.preferredRole) || "your field"}. Would you be open to discussing a potential collaboration? Thank you.`;
  return (
    <div className="mt-3 rounded-lg bg-cream-100 p-3.5 text-sm text-navy">
      <p className="font-semibold">{person.whatsapp ? <>WhatsApp: <a href={waLink(person.whatsapp)} target="_blank" rel="noopener noreferrer" className="underline">{person.whatsapp}</a></> : "No WhatsApp number on their profile. Use LinkedIn."}</p>
      <p className="mt-2 text-xs leading-5">{intro}</p>
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(intro).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => undefined); }}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium underline"
      >
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}{copied ? "Copied" : "Copy intro message"}
      </button>
      <p className="mt-2 text-xs leading-5 text-slate-700">Use these details only for this team. No mass messaging, and do not share contacts outside the platform.</p>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-navy/70 p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div onClick={(e) => e.stopPropagation()} className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-heading text-lg font-bold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}
