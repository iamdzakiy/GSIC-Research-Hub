"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

const TEASER_KEY = "gsic_teaser_seen";

interface TeaserModalProps {
  videoUrl?: string;
  title?: string;
  description?: string;
}

interface Embed {
  type: "youtube" | "instagram";
  embed: string;
}

function getEmbedUrl(url: string): Embed | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) {
    return {
      type: "youtube",
      embed: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
    };
  }
  const ig = url.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
  if (ig) {
    return { type: "instagram", embed: `https://www.instagram.com/reel/${ig[1]}/` };
  }
  return null;
}

function hasSeen(): boolean {
  try {
    return localStorage.getItem(TEASER_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(TEASER_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

function beSafeGetEmbedUrl(url: string): Embed | null {
  return typeof window === "undefined" ? null : getEmbedUrl(url);
}

/**
 * Launch teaser modal — auto-opens ~2s after first landing (unless dismissed
 * with "don't show again"). Supports YouTube / Instagram embeds.
 */
export default function TeaserModal({
  videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title = "Welcome to GSIC Hub",
  description = "Discover opportunities, innovation programs and the research ecosystem from the Ganesha Students Innovation Center.",
}: TeaserModalProps) {
  const [open, setOpen] = useState(false);
  const [dismissForever, setDismissForever] = useState(false);
  const embed = beSafeGetEmbedUrl(videoUrl);

  useEffect(() => {
    if (hasSeen()) return;
    const t = window.setTimeout(() => setOpen(true), 2000);
    return () => window.clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    if (dismissForever) markSeen();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismissForever]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            initial={{ scale: 0.92, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative w-full max-w-2xl glass-strong rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-2">
                {embed?.type === "youtube" ? (
                  <Play className="w-5 h-5 text-[#FF0000]" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#E1306C]" />
                )}
                <h3 className="font-bold text-white font-heading">{title}</h3>
              </div>
              <button
                onClick={close}
                className="text-white/40 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5"
                aria-label="Close teaser"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {embed ? (
                <div className="relative pt-[56.25%] rounded-2xl overflow-hidden bg-black border border-white/10">
                  <iframe
                    src={embed.embed}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 rounded-2xl bg-white/[0.03] border border-dashed border-white/10 text-white/40">
                  <Play className="w-10 h-10" />
                </div>
              )}

              {description && (
                <p className="mt-5 text-sm text-white/60 leading-relaxed">{description}</p>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer select-none hover:text-white/80 transition">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={dismissForever}
                    onClick={() => setDismissForever((v) => !v)}
                    className={cn(
                      "w-4 h-4 rounded-md border flex items-center justify-center transition",
                      dismissForever ? "bg-[#3352CD] border-[#3352CD]" : "border-white/25 hover:border-white/50"
                    )}
                  >
                    {dismissForever && <span className="text-[10px] text-white">✓</span>}
                  </button>
                  Don&apos;t show again
                </label>

                <button
                  onClick={close}
                  className="text-sm bg-gradient-to-r from-[#3352CD] to-[#5CE3B6] hover:from-[#4a6cf7] hover:to-[#7ff0cc] text-white px-5 py-2 rounded-full font-medium shadow-lg shadow-[#3352CD]/30 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}