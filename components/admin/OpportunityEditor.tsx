"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/apiFetch";
import { BENEFIT_CATEGORIES, LEVELS } from "@/lib/opportunity-status";
import { FUNDING_LABEL, MODE_LABEL, OPP_TYPE_ORDER, TYPE_CONFIG, type OppType } from "@/lib/opportunity-config";
import type { Opportunity } from "@/lib/types";

/* ----------------------------------------------------------------- helpers */
type Row = Record<string, string | boolean>;
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const joinLines = (a?: string[] | null) => (a ?? []).join("\n");
const num = (s: string) => (s.trim() === "" ? null : Number(s));
const localInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const isoOrNull = (s: string) => (s ? new Date(s).toISOString() : null);
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]).map((r) => ({ ...r })) : []);

const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const area = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-slate-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

function RowsEditor({ value, onChange, cols, addLabel }: { value: Row[]; onChange: (v: Row[]) => void; cols: { key: string; label: string; area?: boolean; flex?: string }[]; addLabel: string }) {
  return (
    <div className="space-y-2">
      {value.map((r, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <div className="flex flex-1 flex-wrap gap-2">
            {cols.map((c) => (
              <div key={c.key} className={cn("min-w-[8rem]", c.flex ?? "flex-1")}>
                {c.area ? (
                  <textarea rows={2} aria-label={c.label} placeholder={c.label} value={String(r[c.key] ?? "")} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, [c.key]: e.target.value } : x)))} className={area} />
                ) : (
                  <input aria-label={c.label} placeholder={c.label} value={String(r[c.key] ?? "")} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, [c.key]: e.target.value } : x)))} className={input} />
                )}
              </div>
            ))}
          </div>
          <button type="button" aria-label="Hapus baris" onClick={() => onChange(value.filter((_, j) => j !== i))} className="mt-1 rounded-md p-2 text-slate-400 hover:bg-white hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, Object.fromEntries(cols.map((c) => [c.key, ""]))])} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-600 hover:text-brand-700"><Plus className="h-3.5 w-3.5" />{addLabel}</button>
    </div>
  );
}

function Chips({ options, value, onChange, labels }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; labels?: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return <button type="button" key={o} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])} className={cn("rounded-full border px-3 py-1 text-xs font-medium", on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50")}>{labels?.[o] ?? o}</button>;
      })}
    </div>
  );
}

/* -------------------------------------------------------------------- form */
const TABS = [
  ["dasar", "Dasar"], ["ringkas", "Ringkasan Cepat"], ["kriteria", "Kriteria"], ["daftar", "Cara Daftar & Dokumen"], ["seleksi", "Seleksi, Jadwal & FAQ"], ["kontak", "Kontak & Tautan"],
] as const;

type O = Opportunity & Record<string, any>;

function initial(o?: O | null) {
  return {
    type: (o?.type ?? "scholarship") as OppType, title: o?.title ?? "", organizer: o?.organizer ?? "", summary: o?.summary ?? "", description: o?.description ?? "",
    scope: o?.scope ?? "external", status: o?.status ?? "active", isAnnual: !!o?.isAnnual, link: o?.link ?? "", posterUrl: o?.posterUrl ?? "",
    openDate: localInput(o?.openDate), deadline: localInput(o?.deadline), levels: (o?.levels ?? []) as string[], benefitCategories: (o?.benefitCategories ?? []) as string[],
    benefits: joinLines(o?.benefits), requiredSkills: joinLines(o?.requiredSkills), fieldsOfStudy: joinLines(o?.fieldsOfStudy), tags: joinLines(o?.tags),
    quota: o?.quota != null ? String(o.quota) : "", fundingType: o?.fundingType ?? "", fundingAmount: o?.fundingAmount ?? "", attendanceMode: o?.attendanceMode ?? "",
    city: o?.city ?? "", country: o?.country ?? "", location: o?.location ?? "", ageMin: o?.ageMin != null ? String(o.ageMin) : "", ageMax: o?.ageMax != null ? String(o.ageMax) : "",
    nationality: o?.nationality ?? "", minGpa: o?.minGpa != null ? String(o.minGpa) : "", duration: o?.duration ?? "", language: o?.language ?? "",
    programStart: localInput(o?.programStart), programEnd: localInput(o?.programEnd),
    quickFacts: rows(o?.quickFacts), eligibilityCriteria: rows(o?.eligibilityCriteria).map((r) => ({ text: String(r.text ?? ""), required: r.required !== false })) as Row[], eligibility: o?.eligibility ?? "",
    programBenefits: o?.programBenefits ?? "", applySteps: rows(o?.applySteps), howToApply: o?.howToApply ?? "", requiredDocuments: joinLines(o?.requiredDocuments),
    timeline: rows(o?.timeline), selectionStages: rows(o?.selectionStages), faqs: rows(o?.faqs), tips: o?.tips ?? "",
    cpName: o?.cpName ?? "", cpContact: o?.cpContact ?? "", contactEmail: o?.contactEmail ?? "", socialLinks: rows(o?.socialLinks),
  };
}
type Form = ReturnType<typeof initial>;

function toPayload(f: Form) {
  const clean = (rs: Row[], keys: string[]) => rs.filter((r) => keys.some((k) => String(r[k] ?? "").trim())).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])));
  return {
    type: f.type, title: f.title, organizer: f.organizer, summary: f.summary, description: f.description, scope: f.scope, status: f.status, isAnnual: f.isAnnual,
    link: f.link, posterUrl: f.posterUrl || null, openDate: isoOrNull(f.openDate), deadline: isoOrNull(f.deadline) ?? "", levels: f.levels, benefitCategories: f.benefitCategories,
    benefits: lines(f.benefits), requiredSkills: lines(f.requiredSkills), fieldsOfStudy: lines(f.fieldsOfStudy), tags: lines(f.tags).map((t) => t.replace(/^#/, "")),
    quota: num(f.quota), fundingType: f.fundingType || null, fundingAmount: f.fundingAmount, attendanceMode: f.attendanceMode || null, city: f.city, country: f.country, location: f.location,
    ageMin: num(f.ageMin), ageMax: num(f.ageMax), nationality: f.nationality, minGpa: num(f.minGpa), duration: f.duration, language: f.language,
    programStart: isoOrNull(f.programStart), programEnd: isoOrNull(f.programEnd),
    quickFacts: clean(f.quickFacts, ["label", "value"]), eligibilityCriteria: clean(f.eligibilityCriteria, ["text"]), eligibility: f.eligibility, programBenefits: f.programBenefits,
    applySteps: clean(f.applySteps, ["title"]), howToApply: f.howToApply, requiredDocuments: lines(f.requiredDocuments),
    timeline: clean(f.timeline, ["phase"]), selectionStages: clean(f.selectionStages, ["stage"]), faqs: clean(f.faqs, ["q", "a"]), tips: f.tips,
    cpName: f.cpName, cpContact: f.cpContact, contactEmail: f.contactEmail, socialLinks: clean(f.socialLinks, ["url"]),
  };
}

export default function OpportunityEditor({ open, initial: init, onClose, onSaved }: { open: boolean; initial: O | null; onClose: () => void; onSaved: (title: string, created: boolean) => void }) {
  const [f, setF] = useState<Form>(() => initial(init));
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("dasar");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});
  const cfg = useMemo(() => TYPE_CONFIG[f.type], [f.type]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  if (!open) return null;

  const applyPresets = () => {
    setF((p) => ({
      ...p,
      quickFacts: p.quickFacts.length ? p.quickFacts : cfg.presetFacts.map((label) => ({ label, value: "" })),
      requiredDocuments: p.requiredDocuments.trim() ? p.requiredDocuments : cfg.presetDocs.join("\n"),
      applySteps: p.applySteps.length ? p.applySteps : cfg.presetSteps.map((s) => ({ ...s })),
    }));
  };

  const save = async () => {
    setErr(null); setFe({});
    if (!f.title || !f.organizer || !f.deadline) { setErr("Judul, penyelenggara, dan deadline wajib diisi."); setTab("dasar"); return; }
    setBusy(true);
    try {
      const res = await apiFetch("/api/opportunities", { method: init ? "PUT" : "POST", body: JSON.stringify(init ? { id: init.id, ...toPayload(f) } : toPayload(f)) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(body.error ?? `Gagal menyimpan (${res.status})`); setFe(body.fieldErrors ?? {}); return; }
      onSaved(f.title, !init);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Editor peluang">
      <div className="w-full max-w-4xl rounded-xl bg-white text-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold font-heading">{init ? "Edit Peluang" : "Peluang Baru"}</h3>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3">
          {TABS.map(([k, l]) => <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium", tab === k ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800")}>{l}</button>)}
        </div>

        <div className="space-y-5 px-5 py-5">
          {err && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{err}{Object.keys(fe).length > 0 && <ul className="mt-1 list-disc pl-5 text-xs">{Object.entries(fe).map(([k, m]) => <li key={k}>{k}: {m}</li>)}</ul>}</div>}

          {tab === "dasar" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipe *"><select className={input} value={f.type} onChange={(e) => set("type", e.target.value as OppType)}>{OPP_TYPE_ORDER.map((t) => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}</select></Field>
              <Field label="Kategori"><select className={input} value={f.scope} onChange={(e) => set("scope", e.target.value)}><option value="external">Eksternal</option><option value="internal">Internal (ITB)</option></select></Field>
              <Field label="Judul *" className="md:col-span-2"><input className={input} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="mis. Beasiswa XYZ Batch 2 Tahun 2026" /></Field>
              <Field label="Penyelenggara *"><input className={input} value={f.organizer} onChange={(e) => set("organizer", e.target.value)} /></Field>
              <Field label="Status"><select className={input} value={f.status} onChange={(e) => set("status", e.target.value as Form["status"])}><option value="active">Aktif</option><option value="upcoming">Akan datang</option><option value="archived">Diarsipkan (paksa tutup)</option></select></Field>
              <Field label="Pendaftaran dibuka"><input type="datetime-local" className={input} value={f.openDate} onChange={(e) => set("openDate", e.target.value)} /></Field>
              <Field label="Batas pendaftaran *" hint="Setelah lewat, status otomatis “Ditutup”." error={fe.deadline}><input type="datetime-local" className={input} value={f.deadline} onChange={(e) => set("deadline", e.target.value)} /></Field>
              <Field label="Ringkasan singkat (tampil di kartu)" className="md:col-span-2" hint="1–2 kalimat." ><textarea rows={2} className={area} value={f.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
              <Field label="Deskripsi lengkap" hint="Markdown atau HTML didukung." className="md:col-span-2"><textarea rows={8} className={area} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
              <Field label="Jenjang" className="md:col-span-2"><Chips options={LEVELS} value={f.levels} onChange={(v) => set("levels", v)} /></Field>
              <Field label="Kategori benefit (untuk filter)" className="md:col-span-2"><Chips options={BENEFIT_CATEGORIES} value={f.benefitCategories} onChange={(v) => set("benefitCategories", v)} /></Field>
              <Field label="Benefit (satu per baris)"><textarea rows={4} className={area} value={f.benefits} onChange={(e) => set("benefits", e.target.value)} /></Field>
              <Field label="Skill / keahlian (satu per baris)"><textarea rows={4} className={area} value={f.requiredSkills} onChange={(e) => set("requiredSkills", e.target.value)} /></Field>
              <Field label="Tag (satu per baris)"><textarea rows={3} className={area} value={f.tags} onChange={(e) => set("tags", e.target.value)} /></Field>
              <Field label="URL poster"><input className={input} value={f.posterUrl} onChange={(e) => set("posterUrl", e.target.value)} /></Field>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.isAnnual} onChange={(e) => set("isAnnual", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" /> Program tahunan / berulang</label>
            </div>
          )}

          {tab === "ringkas" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <span>Isi sebanyak mungkin — kolom kosong otomatis disembunyikan di halaman detail.</span>
                <button type="button" onClick={applyPresets} className="ml-3 shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">Isi template {cfg.label}</button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Jenis pendanaan"><select className={input} value={f.fundingType} onChange={(e) => set("fundingType", e.target.value)}><option value="">—</option>{Object.entries(FUNDING_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
                <Field label="Nilai / jumlah"><input className={input} value={f.fundingAmount} onChange={(e) => set("fundingAmount", e.target.value)} placeholder="Rp 3.000.000 / bulan" /></Field>
                <Field label="Kuota penerima"><input type="number" min={0} className={input} value={f.quota} onChange={(e) => set("quota", e.target.value)} /></Field>
                <Field label="Format"><select className={input} value={f.attendanceMode} onChange={(e) => set("attendanceMode", e.target.value)}><option value="">—</option>{Object.entries(MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
                <Field label="Kota"><input className={input} value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
                <Field label="Negara"><input className={input} value={f.country} onChange={(e) => set("country", e.target.value)} /></Field>
                <Field label="Usia minimal"><input type="number" min={0} className={input} value={f.ageMin} onChange={(e) => set("ageMin", e.target.value)} /></Field>
                <Field label="Usia maksimal"><input type="number" min={0} className={input} value={f.ageMax} onChange={(e) => set("ageMax", e.target.value)} /></Field>
                <Field label="IPK minimal"><input type="number" step="0.01" min={0} max={4} className={input} value={f.minGpa} onChange={(e) => set("minGpa", e.target.value)} /></Field>
                <Field label="Kewarganegaraan"><input className={input} value={f.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder="WNI / terbuka untuk semua" /></Field>
                <Field label="Durasi"><input className={input} value={f.duration} onChange={(e) => set("duration", e.target.value)} placeholder="12 bulan" /></Field>
                <Field label="Bahasa"><input className={input} value={f.language} onChange={(e) => set("language", e.target.value)} /></Field>
                <Field label="Program mulai"><input type="datetime-local" className={input} value={f.programStart} onChange={(e) => set("programStart", e.target.value)} /></Field>
                <Field label="Program selesai"><input type="datetime-local" className={input} value={f.programEnd} onChange={(e) => set("programEnd", e.target.value)} /></Field>
                <Field label="Lokasi (teks bebas)"><input className={input} value={f.location} onChange={(e) => set("location", e.target.value)} /></Field>
                <Field label="Bidang studi (satu per baris)" className="md:col-span-3"><textarea rows={2} className={area} value={f.fieldsOfStudy} onChange={(e) => set("fieldsOfStudy", e.target.value)} /></Field>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-slate-700">Informasi tambahan khusus {cfg.label.toLowerCase()}</p>
                <RowsEditor value={f.quickFacts} onChange={(v) => set("quickFacts", v)} addLabel="Tambah baris" cols={[{ key: "label", label: "Label", flex: "w-48" }, { key: "value", label: "Nilai" }]} />
              </div>
            </div>
          )}

          {tab === "kriteria" && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-700">Daftar kriteria</p>
                <div className="space-y-2">
                  {f.eligibilityCriteria.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <input aria-label="Kriteria" className={input} value={String(r.text)} onChange={(e) => set("eligibilityCriteria", f.eligibilityCriteria.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="mis. Mahasiswa aktif minimal semester 3" />
                      <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={r.required !== false} onChange={(e) => set("eligibilityCriteria", f.eligibilityCriteria.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} className="h-4 w-4 rounded border-slate-300 text-brand-600" />Wajib</label>
                      <button type="button" aria-label="Hapus" onClick={() => set("eligibilityCriteria", f.eligibilityCriteria.filter((_, j) => j !== i))} className="rounded-md p-2 text-slate-400 hover:bg-white hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => set("eligibilityCriteria", [...f.eligibilityCriteria, { text: "", required: true }])} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-600 hover:text-brand-700"><Plus className="h-3.5 w-3.5" />Tambah kriteria</button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Tidak dicentang “Wajib” = tampil sebagai nilai tambah.</p>
              </div>
              <Field label="Catatan kriteria tambahan" hint="Markdown / HTML."><textarea rows={5} className={area} value={f.eligibility} onChange={(e) => set("eligibility", e.target.value)} /></Field>
              <Field label={`${cfg.headings.benefits} (uraian)`} hint="Markdown / HTML."><textarea rows={5} className={area} value={f.programBenefits} onChange={(e) => set("programBenefits", e.target.value)} /></Field>
            </div>
          )}

          {tab === "daftar" && (
            <div className="space-y-5">
              <div><p className="mb-2 text-xs font-medium text-slate-700">Langkah pendaftaran</p><RowsEditor value={f.applySteps} onChange={(v) => set("applySteps", v)} addLabel="Tambah langkah" cols={[{ key: "title", label: "Judul langkah", flex: "w-64" }, { key: "description", label: "Penjelasan", area: true }]} /></div>
              <Field label="Catatan cara mendaftar (opsional)" hint="Markdown / HTML."><textarea rows={4} className={area} value={f.howToApply} onChange={(e) => set("howToApply", e.target.value)} /></Field>
              <Field label="Dokumen yang dibutuhkan (satu per baris)"><textarea rows={6} className={area} value={f.requiredDocuments} onChange={(e) => set("requiredDocuments", e.target.value)} /></Field>
              <Field label="Tautan pendaftaran resmi" error={fe.link}><input type="url" className={input} value={f.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" /></Field>
            </div>
          )}

          {tab === "seleksi" && (
            <div className="space-y-5">
              <div><p className="mb-2 text-xs font-medium text-slate-700">Jadwal penting</p><RowsEditor value={f.timeline} onChange={(v) => set("timeline", v)} addLabel="Tambah jadwal" cols={[{ key: "phase", label: "Tahap", flex: "w-56" }, { key: "date", label: "Tanggal", flex: "w-40" }, { key: "description", label: "Keterangan" }]} /></div>
              <div><p className="mb-2 text-xs font-medium text-slate-700">Tahapan seleksi</p><RowsEditor value={f.selectionStages} onChange={(v) => set("selectionStages", v)} addLabel="Tambah tahap" cols={[{ key: "stage", label: "Tahap", flex: "w-56" }, { key: "date", label: "Waktu", flex: "w-40" }, { key: "description", label: "Keterangan" }]} /></div>
              <div><p className="mb-2 text-xs font-medium text-slate-700">FAQ</p><RowsEditor value={f.faqs} onChange={(v) => set("faqs", v)} addLabel="Tambah FAQ" cols={[{ key: "q", label: "Pertanyaan" }, { key: "a", label: "Jawaban", area: true }]} /></div>
              <Field label="Tips lolos" hint="Markdown / HTML."><textarea rows={5} className={area} value={f.tips} onChange={(e) => set("tips", e.target.value)} /></Field>
            </div>
          )}

          {tab === "kontak" && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Nama narahubung"><input className={input} value={f.cpName} onChange={(e) => set("cpName", e.target.value)} /></Field>
                <Field label="Kontak (WA / telp)"><input className={input} value={f.cpContact} onChange={(e) => set("cpContact", e.target.value)} /></Field>
                <Field label="Email" error={fe.contactEmail}><input type="email" className={input} value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></Field>
              </div>
              <div><p className="mb-2 text-xs font-medium text-slate-700">Tautan lain (Instagram, panduan PDF, dll.)</p><RowsEditor value={f.socialLinks} onChange={(v) => set("socialLinks", v)} addLabel="Tambah tautan" cols={[{ key: "label", label: "Label", flex: "w-48" }, { key: "url", label: "https://…" }]} /></div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
          <button type="button" onClick={save} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{init ? "Simpan perubahan" : "Terbitkan"}</button>
        </div>
      </div>
    </div>
  );
}
