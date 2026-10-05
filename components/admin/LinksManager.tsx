"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/apiFetch";
import { LINK_CATEGORIES } from "@/lib/validation/opportunity";

interface L { id: string; title: string; url: string; description: string | null; category: string; tags: string[]; isFeatured: boolean; order: number; status: "published" | "hidden" }
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const blank = { title: "", url: "", description: "", category: LINK_CATEGORIES[0] as string, tags: "", isFeatured: false, order: "0", status: "published" as "published" | "hidden" };

export default function LinksManager() {
  const [items, setItems] = useState<L[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<(typeof blank & { id?: string }) | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await apiFetch("/api/links?all=1"); setItems((await r.json()).links ?? []); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form) return;
    setBusy(true); setErr(null);
    const payload = { title: form.title, url: form.url, description: form.description, category: form.category, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), isFeatured: form.isFeatured, order: Number(form.order) || 0, status: form.status };
    const r = await apiFetch("/api/links", { method: form.id ? "PUT" : "POST", body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload) });
    const b = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(b.error ?? "Gagal menyimpan"); return; }
    setForm(null); load();
  };
  const remove = async (l: L) => { if (!confirm(`Hapus “${l.title}”?`)) return; await apiFetch("/api/links", { method: "DELETE", body: JSON.stringify({ id: l.id }) }); load(); };
  const toggle = async (l: L, patch: Partial<L>) => { await apiFetch("/api/links", { method: "PUT", body: JSON.stringify({ id: l.id, ...patch }) }); load(); };

  const shown = items.filter((l) => !filter || `${l.title} ${l.url} ${l.category}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-900">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold font-heading">Kumpulan Pranala <span className="text-sm font-normal text-slate-500">({items.length})</span></h3>
        <input aria-label="Cari" placeholder="Cari…" value={filter} onChange={(e) => setFilter(e.target.value)} className={cn(input, "ml-auto max-w-xs")} />
        <button type="button" onClick={() => setForm({ ...blank })} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"><Plus className="h-4 w-4" />Tambah</button>
      </div>

      {form && (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {err && <p role="alert" className="text-sm text-rose-700">{err}</p>}
          <div className="grid gap-3 md:grid-cols-2">
            <input aria-label="Judul" placeholder="Judul" className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input aria-label="URL" placeholder="https://…" className={input} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            <select aria-label="Kategori" className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{LINK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <input aria-label="Tag" placeholder="Tag (pisahkan dengan koma)" className={input} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            <textarea aria-label="Deskripsi" placeholder="Deskripsi singkat" rows={2} className="md:col-span-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-brand-600" />Pilihan GSIC (unggulan)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.status === "hidden"} onChange={(e) => setForm({ ...form, status: e.target.checked ? "hidden" : "published" })} className="h-4 w-4 rounded border-slate-300 text-brand-600" />Sembunyikan</label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Simpan</button>
            <button type="button" onClick={() => { setForm(null); setErr(null); }} className="h-9 rounded-lg border border-slate-300 px-4 text-sm">Batal</button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        {loading ? <p className="py-8 text-center text-sm text-slate-500">Memuat…</p> : (
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="py-2 pr-3">Judul</th><th className="py-2 pr-3">Kategori</th><th className="py-2 pr-3">Status</th><th className="py-2" /></tr></thead>
            <tbody>
              {shown.map((l) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-3"><a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-brand-700">{l.title}<ExternalLink className="h-3 w-3 text-slate-400" /></a><div className="max-w-xs truncate text-xs text-slate-500">{l.url}</div></td>
                  <td className="py-2.5 pr-3 text-slate-600">{l.category}</td>
                  <td className="py-2.5 pr-3"><button type="button" onClick={() => toggle(l, { status: l.status === "published" ? "hidden" : "published" })} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", l.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{l.status === "published" ? "Tayang" : "Tersembunyi"}</button></td>
                  <td className="py-2.5 text-right">
                    <button type="button" aria-label="Unggulkan" onClick={() => toggle(l, { isFeatured: !l.isFeatured })} className="rounded-md p-1.5 hover:bg-slate-100"><Star className={cn("h-4 w-4", l.isFeatured ? "fill-amber-400 text-amber-500" : "text-slate-400")} /></button>
                    <button type="button" aria-label="Edit" onClick={() => setForm({ id: l.id, title: l.title, url: l.url, description: l.description ?? "", category: l.category, tags: l.tags.join(", "), isFeatured: l.isFeatured, order: String(l.order), status: l.status })} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                    <button type="button" aria-label="Hapus" onClick={() => remove(l)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
