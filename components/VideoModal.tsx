"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

/**
 * Extract the video ID from a YouTube or Instagram URL.
 * Supports:
 * - YouTube: https://www.youtube.com/watch?v=VIDEO_ID  |  https://youtu.be/VIDEO_ID
 * - Instagram: https://www.instagram.com/reel/SHORTCODE/ | https://www.instagram.com/p/SHORTCODE/
 */
function getEmbedUrl(url: string): { type: "youtube" | "instagram"; embed: string } | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return {
      type: "youtube",
      embed: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
    };
  }

  // Instagram Reel / Post — embed via the oembed-less player approach
  const igReelMatch = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/);
  const igPostMatch = url.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/);
  if (igReelMatch || igPostMatch) {
    const code = (igReelMatch || igPostMatch)![1];
    return {
      type: "instagram",
      // Instagram doesn't have a clean public embed URL like YouTube,
      // so we fall back to an embed attempt via the reel URL.
      embed: `https://www.instagram.com/reel/${code}/`,
    };
  }

  return null;
}

export default function VideoModal({ open, onClose, videoUrl, title }: VideoModalProps) {
  const embed = videoUrl ? getEmbedUrl(videoUrl) : null;

  const close = () => onClose();

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (open) {
      window.addEventListener("keydown", handleKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-4xl xl:max-w-5xl bg-[#111827] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#111827] to-[#1F2937]">
              <h3 className="font-bold text-white font-heading">{title || "Media"}</h3>
              <button
                onClick={close}
                className="text-white/40 hover:text-white/70 transition p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video container */}
            <div className="relative pt-[56.25%] bg-black">
              {embed ? (
                embed.type === "youtube" ? (
                  <iframe
                    src={embed.embed}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                ) : (
                  // Instagram embed
                  <iframe
                    src={embed.embed}
                    title={title}
                    allow="encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                    scrolling="no"
                  />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/40">
                  <p>Unsupported video URL. Use a YouTube or Instagram link.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
