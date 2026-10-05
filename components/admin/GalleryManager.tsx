"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, extractError } from "@/lib/apiFetch";

interface G { id: string; title: string; caption: string | null; imageUrl: string; eventLabel: string | null; order: number; isPublished: boolean }
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const blank = { title: "", caption: "", imageUrl: "", eventLabel: "", order: "0", isPublished: true };

export default function GalleryManager() {
  const [items, setItems] = useState<G[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<(typeof blank & { id?: string }) | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await apiFetch("/api/gallery?all=1"); setItems((await r.json()).items ?? []); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form) return; setBusy(true); setErr(null);
    try {
      const body = { ...(form.id ? { id: form.id } : {}), title: form.title, caption: form.caption || null, imageUrl: form.imageUrl, eventLabel: form.eventLabel || null, order: Number(form.order) || 0, isPublished: form.isPublished };
      const r = await apiFetch("/api/gallery", { method: form.id ? "PUT" : "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error(await extractError(r));
      setForm(null); await load();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const del = async (id: string) => {
    if (!confirm("Delete this photo from the gallery?")) return;
    const r = await apiFetch("/api/gallery", { method: "DELETE", body: JSON.stringify({ id }) });
    if (r.ok) load();
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 text-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div><h2 className="text-lg font-bold">Event gallery</h2><p className="text-xs text-slate-500">Paste an image URL (for example from public Supabase Storage). Shown on the home page and dashboard.</p></div>
        <button type="button" onClick={() => { setErr(null); setForm({ ...blank }); }} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> Add</button>
      </div>
      {form && (
        <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <input className={input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className={input} placeholder="Event label (e.g. PKM Bootcamp 2026)" value={form.eventLabel} onChange={(e) => setForm({ ...form, eventLabel: e.target.value })} />
          <input className={`${input} sm:col-span-2`} placeholder="https://…/photo.jpg" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <input className={`${input} sm:col-span-2`} placeholder="Caption (optional)" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
          <input className={input} type="number" min={0} placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Show on site</label>
          {err && <p role="alert" className="text-sm text-rose-700 sm:col-span-2">{err}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" disabled={busy} onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
            <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          </div>
        </div>
      )}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : items.length === 0 ? <p className="text-sm text-slate-500">No photos yet.</p> : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => (
            <li key={g.id} className="overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.imageUrl} alt={g.title} className="h-32 w-full object-cover" loading="lazy" />
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{g.title}</p><p className="truncate text-xs text-slate-500">{g.eventLabel ?? "—"} {g.isPublished ? "" : "· hidden"}</p></div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" aria-label="Edit" onClick={() => setForm({ id: g.id, title: g.title, caption: g.caption ?? "", imageUrl: g.imageUrl, eventLabel: g.eventLabel ?? "", order: String(g.order), isPublished: g.isPublished })} className="rounded p-1.5 text-slate-600 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                  <button type="button" aria-label="Delete" onClick={() => del(g.id)} className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
