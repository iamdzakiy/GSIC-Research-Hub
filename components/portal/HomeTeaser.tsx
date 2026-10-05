"use client";
import { useState } from "react";
import { Play } from "lucide-react";
import VideoModal from "@/components/VideoModal";

export default function HomeTeaser({ videoUrl }: { videoUrl: string }) {
  const [open, setOpen] = useState(false);
  if (!videoUrl) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint">
        <Play className="h-4 w-4" aria-hidden="true" /> Watch teaser
      </button>
      <VideoModal open={open} onClose={() => setOpen(false)} videoUrl={videoUrl} title="GSIC Teaser" />
    </>
  );
}
