"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { updateEvent } from "@/services/events";
import type { GSICEvent } from "@/lib/types";

// Admin editor for every event field. Dates are entered in WIB (UTC+7), the community's timezone.
const WIB = 7 * 3600_000;
const toLocal = (iso: string) => new Date(new Date(iso).getTime() + WIB).toISOString().slice(0, 16);
const fromLocal = (v: string) => new Date(`${v}:00+07:00`).toISOString();

const box = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] text-sm";
const label = "block text-xs text-white/50 mb-1";

export default function EventEditor({ event, onClose, onSaved }: { event: GSICEvent; onClose: () => void; onSaved: (e: GSICEvent) => void }) {
  const [f, setF] = useState({
    title: event.title, slug: event.slug ?? "", type: event.type as string, shortDescription: event.shortDescription, description: event.description,
    dateLabel: event.dateLabel ?? "", startDate: toLocal(event.startDate), endDate: toLocal(event.endDate), registrationDeadline: toLocal(event.registrationDeadline),
    location: event.location, mode: event.mode ?? "onsite", meetingUrl: event.meetingUrl ?? "", maxParticipants: event.maxParticipants,
    registrationOpen: event.registrationOpen ?? true, status: event.status as string,
    hasPreTest: event.hasPreTest, hasPostTest: event.hasPostTest, preTestExplanation: event.preTestExplanation, postTestExplanation: event.postTestExplanation,
    modules: JSON.stringify(event.modules ?? [], null, 2), speakers: JSON.stringify(event.speakers ?? [], null, 2),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    let modules: unknown, speakers: unknown;
    try { modules = JSON.parse(f.modules); speakers = JSON.parse(f.speakers); } catch { return setError("Modules and speakers must be valid JSON lists."); }
    if (!Array.isArray(modules) || !Array.isArray(speakers)) return setError("Modules and speakers must be JSON lists.");
    setBusy(true);
    setError("");
    try {
      const data = {
        title: f.title, slug: f.slug.trim() || null, type: f.type, shortDescription: f.shortDescription, description: f.description,
        dateLabel: f.dateLabel.trim() || null, // clear it to show the exact dates
        startDate: fromLocal(f.startDate), endDate: fromLocal(f.endDate), registrationDeadline: fromLocal(f.registrationDeadline),
        location: f.location, mode: f.mode, meetingUrl: f.meetingUrl.trim() || null, maxParticipants: Number(f.maxParticipants) || 0,
        registrationOpen: f.registrationOpen, status: f.status, hasPreTest: f.hasPreTest, hasPostTest: f.hasPostTest,
        preTestExplanation: f.preTestExplanation, postTestExplanation: f.postTestExplanation, modules, speakers,
      };
      const saved = (await updateEvent(event.id, data as never)) as GSICEvent;
      onSaved(saved);
    } catch (er) {
      setError(er instanceof Error ? er.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Edit event">
      <form onSubmit={save} className="my-6 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0B1120] text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-semibold font-heading">Edit event</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-white/60 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={label} htmlFor="ee-title">Title</label><input id="ee-title" className={box} value={f.title} onChange={(e) => set("title", e.target.value)} required /></div>
          <div><label className={label} htmlFor="ee-slug">Slug (URL: /events/slug)</label><input id="ee-slug" className={box} value={f.slug} onChange={(e) => set("slug", e.target.value)} pattern="[a-z0-9-]*" /></div>
          <div><label className={label} htmlFor="ee-type">Type</label><select id="ee-type" className={box} value={f.type} onChange={(e) => set("type", e.target.value)}><option value="bootcamp">bootcamp</option><option value="sandbox">sandbox</option></select></div>
          <div className="sm:col-span-2"><label className={label} htmlFor="ee-short">Short description</label><input id="ee-short" className={box} value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={label} htmlFor="ee-desc">Description</label><textarea id="ee-desc" rows={6} className={box} value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={label} htmlFor="ee-label">Date label (shown instead of exact dates while TBA; clear it once dates are final)</label><input id="ee-label" className={box} value={f.dateLabel} onChange={(e) => set("dateLabel", e.target.value)} placeholder="e.g. Awal Desember 2026, tanggal menyusul" /></div>
          <div><label className={label} htmlFor="ee-start">Start (WIB)</label><input id="ee-start" type="datetime-local" className={box} value={f.startDate} onChange={(e) => set("startDate", e.target.value)} required /></div>
          <div><label className={label} htmlFor="ee-end">End (WIB)</label><input id="ee-end" type="datetime-local" className={box} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} required /></div>
          <div><label className={label} htmlFor="ee-dl">Registration deadline (WIB)</label><input id="ee-dl" type="datetime-local" className={box} value={f.registrationDeadline} onChange={(e) => set("registrationDeadline", e.target.value)} required /></div>
          <div><label className={label} htmlFor="ee-cap">Capacity</label><input id="ee-cap" type="number" min={1} className={box} value={f.maxParticipants} onChange={(e) => set("maxParticipants", Number(e.target.value))} /></div>
          <div><label className={label} htmlFor="ee-loc">Location</label><input id="ee-loc" className={box} value={f.location} onChange={(e) => set("location", e.target.value)} /></div>
          <div><label className={label} htmlFor="ee-mode">Mode</label><select id="ee-mode" className={box} value={f.mode} onChange={(e) => set("mode", e.target.value as "online")}><option value="online">online</option><option value="onsite">onsite</option><option value="hybrid">hybrid</option></select></div>
          <div className="sm:col-span-2"><label className={label} htmlFor="ee-url">Meeting link (only registered users see it)</label><input id="ee-url" type="url" className={box} value={f.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} placeholder="https://zoom.us/j/..." /></div>
          <div><label className={label} htmlFor="ee-status">Status</label><select id="ee-status" className={box} value={f.status} onChange={(e) => set("status", e.target.value)}>{["upcoming", "ongoing", "completed", "archived", "active"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <label className="flex items-center gap-2 text-sm sm:mt-6"><input type="checkbox" checked={f.registrationOpen} onChange={(e) => set("registrationOpen", e.target.checked)} className="accent-[#5CE3B6]" /> Registration open</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.hasPreTest} onChange={(e) => set("hasPreTest", e.target.checked)} className="accent-[#5CE3B6]" /> Has pre-test</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.hasPostTest} onChange={(e) => set("hasPostTest", e.target.checked)} className="accent-[#5CE3B6]" /> Has post-test</label>
          <div className="sm:col-span-2"><label className={label} htmlFor="ee-pre">Pre-test explanation</label><textarea id="ee-pre" rows={2} className={box} value={f.preTestExplanation} onChange={(e) => set("preTestExplanation", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={label} htmlFor="ee-post">Post-test explanation</label><textarea id="ee-post" rows={2} className={box} value={f.postTestExplanation} onChange={(e) => set("postTestExplanation", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={label} htmlFor="ee-mod">Modules / episodes (JSON list: title, description, dateLabel, durationHours)</label><textarea id="ee-mod" rows={8} className={`${box} font-mono text-xs`} value={f.modules} onChange={(e) => set("modules", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={label} htmlFor="ee-spk">Speakers / panelists (JSON list: name, roleTitle, institution)</label><textarea id="ee-spk" rows={5} className={`${box} font-mono text-xs`} value={f.speakers} onChange={(e) => set("speakers", e.target.value)} /></div>
          {error && <p role="alert" className="sm:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#3352CD] px-5 py-2 text-sm font-semibold hover:bg-[#4a6cf7] disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? "Saving…" : "Save event"}
          </button>
        </div>
      </form>
    </div>
  );
}
