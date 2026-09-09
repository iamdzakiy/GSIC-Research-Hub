"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download } from "lucide-react";

interface PDFViewerModalProps {
  open: boolean;
  onClose: () => void;
  /** Direct URL to a `.pdf` (or viewable) document. */
  url: string;
  title?: string;
}

/**
 * Modal embedded PDF viewer. Renders the document in an `<iframe>` and offers a
 * direct download action. Blocks body scroll and closes on Escape / overlay.
 */
export default function PDFViewerModal({ open, onClose, url, title = "Document" }: PDFViewerModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative w-full max-w-5xl h-[85vh] glass-strong rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-[#5CE3B6] shrink-0" />
                <h3 className="font-semibold text-white font-heading truncate">{title}</h3>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-2 rounded-lg text-white/60 hover:text-[#5CE3B6] hover:bg-white/5 transition"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#0B1120]">
              <iframe src={url} title={title} className="w-full h-full border-0" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}