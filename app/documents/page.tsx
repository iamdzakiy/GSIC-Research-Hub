"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Eye, Search, FolderOpen, ShieldCheck } from "lucide-react";
import { GsicDocument, DocumentType } from "@/lib/types";
import { getDocuments } from "@/services/documents";
import SkeletonCard from "@/components/ui/SkeletonCard";
import PDFViewerModal from "@/components/modals/PDFViewerModal";
import { cn } from "@/lib/cn";

const TYPE_META: Record<DocumentType, { label: string; iconColor: string }> = {
  report: { label: "Reports", iconColor: "text-[#60A5FA] bg-[#3352CD]/15" },
  portfolio: { label: "Portfolios", iconColor: "text-[#5CE3B6] bg-[#5CE3B6]/15" },
  proposal: { label: "Proposals", iconColor: "text-[#A78BFA] bg-[#8B5CF6]/15" },
  template: { label: "Templates", iconColor: "text-[#E2C65C] bg-[#E2C65C]/15" },
  guideline: { label: "Guidelines", iconColor: "text-[#F2F8C9] bg-[#F2F8C9]/15" },
};

const ORDER: DocumentType[] = ["template", "guideline", "report", "proposal", "portfolio"];

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });
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
      const list = await getDocuments({
        pageSize: 100,
        type: activeType === "all" ? undefined : activeType,
        search: debounced || undefined,
      });
      setDocs(list);
    } finally {
      setLoading(false);
    }
  }, [activeType, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = ORDER.map((t) => ({ type: t, ...TYPE_META[t], items: docs.filter((d) => d.type === t) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-[#5CE3B6] bg-[#5CE3B6]/10 border border-[#5CE3B6]/30 rounded-full px-3 py-1 mb-4">
          <FolderOpen className="w-3.5 h-3.5" /> Resource Repository
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-heading text-white tracking-tight gradient-text">
          Documents &amp; Resources
        </h1>
        <p className="mt-4 text-white/60 max-w-xl mx-auto">
          Templates, guidelines, reports and proposals to accelerate your research journey.
        </p>
        <div className="relative mt-8 max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full glass rounded-full pl-11 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#3352CD]/60"
          />
        </div>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-2 mb-10">
        <button
          onClick={() => setActiveType("all")}
          className={cn("text-xs px-3 py-1.5 rounded-full border transition", activeType === "all" ? "bg-[#3352CD]/40 border-[#3352CD] text-white" : "bg-white/5 border-white/10 text-white/50 hover:text-white")}
        >All</button>
        {ORDER.map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t === activeType ? "all" : t)}
            className={cn("text-xs px-3 py-1.5 rounded-full border transition", activeType === t ? "bg-[#3352CD]/40 border-[#3352CD] text-white" : "bg-white/5 border-white/10 text-white/50 hover:text-white")}
          >{TYPE_META[t].label}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} showMedia={false} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center text-white/40 py-20">
          <ShieldCheck className="w-10 h-10 mx-auto text-white/15 mb-3" />
          <p className="text-lg">No documents match your filters.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.type}>
              <h2 className="flex items-center gap-2 text-lg font-bold font-heading text-white mb-4">
                {g.label}
                <span className="text-xs font-normal text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{g.items.length}</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="glass rounded-2xl p-5 border border-white/10 card-hover flex flex-col"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", g.iconColor)}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="mt-3 font-semibold text-white font-heading leading-snug">{doc.title}</h3>
                    <p className="mt-1 text-xs text-white/40">
                      {doc.author ? `${doc.author} · ` : ""}{timeAgo(doc.uploadedAt)}
                    </p>
                    {doc.description && (
                      <p className="mt-2 text-sm text-white/50 line-clamp-2">{doc.description}</p>
                    )}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {doc.tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/40">#{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setPreview(doc)}
                        className="flex items-center gap-1 text-xs bg-[#3352CD]/30 hover:bg-[#3352CD]/50 text-white px-3 py-1.5 rounded-full transition"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-1 text-xs bg-[#5CE3B6]/15 hover:bg-[#5CE3B6]/25 text-[#5CE3B6] px-3 py-1.5 rounded-full transition"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <PDFViewerModal
        open={!!preview}
        onClose={() => setPreview(null)}
        url={preview?.url || ""}
        title={preview?.title || "Document"}
      />
    </div>
  );
}