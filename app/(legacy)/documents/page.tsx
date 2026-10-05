"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Download, Eye, Search, FolderOpen, ShieldCheck } from "lucide-react";
import { GsicDocument, DocumentType } from "@/lib/types";
import { getDocuments } from "@/services/documents";
import Navbar from "@/components/Navbar";
import PDFViewerModal from "@/components/modals/PDFViewerModal";
import { cn } from "@/lib/cn";

const TYPE_META: Record<DocumentType, { label: string; icon: string }> = {
  template: { label: "Template", icon: "bg-brand-50 text-brand-700" },
  guideline: { label: "Panduan", icon: "bg-cream-100 text-slate-800" },
  report: { label: "Laporan", icon: "bg-mint-100 text-mint-800" },
  proposal: { label: "Proposal", icon: "bg-brand-50 text-brand-700" },
  portfolio: { label: "Portofolio", icon: "bg-mint-100 text-mint-800" },
};
const ORDER: DocumentType[] = ["template", "guideline", "report", "proposal", "portfolio"];

function timeAgo(d: string): string {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 30) return `${days} hari lalu`;
  return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "short" });
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<GsicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<DocumentType | "all">("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [preview, setPreview] = useState<GsicDocument | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDocs(await getDocuments({ pageSize: 100, type: activeType === "all" ? undefined : activeType, search: debounced || undefined }));
    } finally {
      setLoading(false);
    }
  }, [activeType, debounced]);

  useEffect(() => { load(); }, [load]);

  const groups = ORDER.map((t) => ({ type: t, ...TYPE_META[t], items: docs.filter((d) => d.type === t) })).filter((g) => g.items.length > 0);
  const chip = (on: boolean) => cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600", on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300");

  return (
    <>
      <Navbar />
      <header className="bg-navy pt-16 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-mint/40 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint"><FolderOpen className="h-3.5 w-3.5" aria-hidden="true" /> Repositori</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Dokumen & <span className="text-cream">Sumber Daya</span></h1>
          <p className="mt-2 max-w-xl text-slate-300">Template, panduan, laporan, dan proposal untuk mempercepat persiapan riset dan aplikasi Anda.</p>
          <div className="relative mt-6 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <label htmlFor="doc-q" className="sr-only">Cari dokumen</label>
            <input id="doc-q" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari dokumen…" className="h-11 w-full rounded-lg bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mint" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter jenis dokumen">
          <button type="button" aria-pressed={activeType === "all"} onClick={() => setActiveType("all")} className={chip(activeType === "all")}>Semua</button>
          {ORDER.map((t) => (
            <button key={t} type="button" aria-pressed={activeType === t} onClick={() => setActiveType(t === activeType ? "all" : t)} className={chip(activeType === t)}>{TYPE_META[t].label}</button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <ShieldCheck className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-700">Tidak ada dokumen yang cocok.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((g) => (
              <section key={g.type} aria-labelledby={`g-${g.type}`}>
                <h2 id={`g-${g.type}`} className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  {g.label}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{g.items.length}</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((doc) => (
                    <article key={doc.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", g.icon)}><FileText className="h-5 w-5" aria-hidden="true" /></span>
                      <h3 className="mt-3 text-sm font-semibold leading-snug text-slate-900">{doc.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{doc.author ? `${doc.author} · ` : ""}{timeAgo(doc.uploadedAt)}</p>
                      {doc.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{doc.description}</p>}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {doc.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] text-slate-700">#{t}</span>)}
                        </div>
                      )}
                      <div className="mt-auto flex gap-2 pt-4">
                        <button type="button" onClick={() => setPreview(doc)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"><Eye className="h-3.5 w-3.5" aria-hidden="true" /> Pratinjau</button>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><Download className="h-3.5 w-3.5" aria-hidden="true" /> Unduh</a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <PDFViewerModal open={!!preview} onClose={() => setPreview(null)} url={preview?.url || ""} title={preview?.title || "Dokumen"} />
    </>
  );
}
