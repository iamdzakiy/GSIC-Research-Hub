"use client";
// PDFs open in the in-page viewer; anything else (Drive, Notion) opens in a new tab.
import { useState } from "react";
import dynamic from "next/dynamic";
import { FileText } from "lucide-react";
import { cn } from "@/lib/cn";

const PDFViewerModal = dynamic(() => import("@/components/modals/PDFViewerModal"), { ssr: false });
const isPdf = (u: string) => /\.pdf($|\?)/i.test(u);

export default function GuidebookButton({ url, title, className }: { url: string; title: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const cls = cn("inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-ink-2 hover:border-slate-400 hover:text-ink", className);
  if (!isPdf(url)) return <a href={url} target="_blank" rel="noopener noreferrer" className={cls}><FileText className="h-4 w-4" aria-hidden="true" />Guidebook</a>;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cls}><FileText className="h-4 w-4" aria-hidden="true" />Read guidebook</button>
      {open && <PDFViewerModal open onClose={() => setOpen(false)} url={url} title={`Guidebook · ${title}`} />}
    </>
  );
}
