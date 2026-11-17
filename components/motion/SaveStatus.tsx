"use client";
import { CloudOff, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export type SaveState = "idle" | "saving" | "saved" | "offline" | "error";

const COPY: Record<SaveState, string> = { idle: "", saving: "Saving…", saved: "Saved", offline: "Offline. Saved on this device", error: "Could not save. Retrying" };

/** The autosave label. The dot morphs into a drawn check when "Saving…" becomes "Saved". Fixed height, so nothing shifts. */
export default function SaveStatus({ state, className }: { state: SaveState; className?: string }) {
  return (
    <p role="status" aria-live="polite" className={cn("flex h-5 items-center gap-1.5 text-xs font-medium", state === "error" ? "text-danger-700" : state === "offline" ? "text-warning-800" : "text-ink-3", className)}>
      {state === "saving" && <span className="h-1.5 w-1.5 rounded-full bg-ink-3 opacity-70" aria-hidden="true" />}
      {state === "saved" && (
        <svg key="ok" viewBox="0 0 16 16" className="h-3.5 w-3.5 text-success-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8.5l3.2 3.2L13 4.8" pathLength={1} strokeDasharray={1} strokeDashoffset={1} style={{ animation: "draw-line var(--dur-slow) var(--ease-out) forwards" }} />
        </svg>
      )}
      {state === "offline" && <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />}
      {state === "error" && <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
      <span key={state} className="fade-in">{COPY[state]}</span>
    </p>
  );
}

/** A check that draws itself. Used on result and confirmation screens. */
export function DrawCheck({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 56 56" width={size} height={size} className={cn("text-success-700", className)} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="28" cy="28" r="25" className="opacity-20" />
      <path d="M17 29l8 8 15-17" pathLength={1} strokeDasharray={1} strokeDashoffset={1} style={{ animation: "draw-line var(--dur-set-piece) var(--ease-out) 120ms forwards" }} />
    </svg>
  );
}
