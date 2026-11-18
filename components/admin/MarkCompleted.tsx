"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

/** "Mark as completed" for one event, with an optional recap in Indonesian. */
export default function MarkCompleted({ slug, status, onDone }: { slug: string; status: string; onDone: (next: string) => void }) {
  const [open, setOpen] = useState(false);
  const [recap, setRecap] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go(undo: boolean) {
    setBusy(true); setErr("");
    try {
      const res = await apiFetch(`/api/events/${encodeURIComponent(slug)}/complete`, { method: "POST", body: JSON.stringify({ recap, undo }) });
      const b = await res.json().catch(() => null);
      if (!res.ok) return setErr(b?.error ?? "Could not save.");
      setOpen(false); onDone(b?.status ?? status);
    } finally { setBusy(false); }
  }

  if (status === "completed") return <button type="button" disabled={busy} onClick={() => go(true)} className="text-xs text-white/60 hover:underline">Reopen</button>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-xs text-mint hover:underline">Mark as completed</button>;
  return (
    <div className="w-72 rounded-lg bg-white/10 p-3 text-xs">
      <label htmlFor={`recap-${slug}`} className="mb-1 block text-white/70">Recap (shown instead of the form)</label>
      <textarea id={`recap-${slug}`} lang="id" rows={3} maxLength={1200} value={recap} onChange={(e) => setRecap(e.target.value)} className="w-full rounded bg-white/10 p-2 text-white" />
      {err && <p className="mt-1 text-rose-300">{err}</p>}
      <div className="mt-2 flex gap-3"><button type="button" disabled={busy} onClick={() => go(false)} className="font-semibold text-mint">Mark completed</button><button type="button" onClick={() => setOpen(false)} className="text-white/60">Cancel</button></div>
    </div>
  );
}

/** Certificates on or off for one event. */
export function CertificateToggle({ slug, enabled, onDone }: { slug: string; enabled: boolean; onDone: (v: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="flex items-center gap-1.5 text-xs text-white/70">
      <input type="checkbox" checked={enabled} disabled={busy} onChange={async (e) => {
        setBusy(true);
        const res = await apiFetch(`/api/events/${encodeURIComponent(slug)}/certificate`, { method: "POST", body: JSON.stringify({ enabled: e.target.checked }) });
        if (res.ok) onDone(e.target.checked);
        setBusy(false);
      }} />
      Certificates
    </label>
  );
}
