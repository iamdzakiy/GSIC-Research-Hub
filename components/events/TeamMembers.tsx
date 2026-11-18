"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/cn";
import { nimError, normalizeNim } from "@/lib/nim";

export interface MemberRow { nim: string; name: string; email: string }
type Lookup = { state: "idle" | "checking" } | { state: "found"; firstName: string; major: string } | { state: "missing" };

const input = (err?: string) => cn("h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2", err ? "border-rose-400 focus:ring-rose-500/20" : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20");

function Row({ index, row, own, onChange, onRemove }: { index: number; row: MemberRow; own: string | null; onChange: (r: MemberRow) => void; onRemove: () => void }) {
  const [look, setLook] = useState<Lookup>({ state: "idle" });
  const digits = normalizeNim(row.nim);
  const problem = row.nim ? nimError("ITB", row.nim) : null;
  const isOwn = !!own && digits === own;
  const ref = useRef(onChange); ref.current = onChange;

  useEffect(() => {
    if (!digits || nimError("ITB", digits) || isOwn) { setLook({ state: "idle" }); return; }
    setLook({ state: "checking" });
    let live = true;
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/users/team-lookup?nim=${encodeURIComponent(digits)}`);
        const b = (await res.json().catch(() => null)) as { found?: boolean; firstName?: string | null; major?: string | null } | null;
        if (!live) return;
        setLook(res.ok && b?.found ? { state: "found", firstName: b.firstName ?? "", major: b.major ?? "" } : res.ok ? { state: "missing" } : { state: "idle" });
      } catch { if (live) setLook({ state: "idle" }); }
    }, 500);
    return () => { live = false; clearTimeout(t); };
  }, [digits, isOwn]);

  const err = isOwn ? "Itu NIM kamu sendiri." : problem;
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor={`tm-${index}`} className="mb-1 block text-xs font-medium text-slate-700">NIM anggota {index + 1}</label>
          <input id={`tm-${index}`} inputMode="numeric" autoComplete="off" value={row.nim} onChange={(e) => onChange({ ...row, nim: e.target.value.replace(/[^\d\s.\-_]/g, "") })} aria-invalid={!!err} aria-describedby={`tm-${index}-s`} className={input(err ?? undefined)} />
        </div>
        <button type="button" onClick={onRemove} aria-label={`Hapus anggota ${index + 1}`} className="mb-0.5 rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>
      <p id={`tm-${index}-s`} role="status" className={cn("mt-1.5 min-h-[1.25rem] text-xs", err ? "text-rose-600" : look.state === "found" ? "text-mint-800" : "text-slate-500")}>
        {err ?? (look.state === "checking" ? "Mencari…" : look.state === "found" ? `Ditemukan: ${look.firstName}${look.major ? `, ${look.major}` : ""}` : look.state === "missing" ? "Belum ada di Hub. Isi nama dan email ITB-nya." : "")}
      </p>
      {look.state === "missing" && !err && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div><label htmlFor={`tm-${index}-n`} className="mb-1 block text-xs font-medium text-slate-700">Nama</label><input id={`tm-${index}-n`} value={row.name} onChange={(e) => onChange({ ...row, name: e.target.value })} className={input()} /></div>
          <div><label htmlFor={`tm-${index}-e`} className="mb-1 block text-xs font-medium text-slate-700">Email ITB</label><input id={`tm-${index}-e`} type="email" inputMode="email" value={row.email} onChange={(e) => onChange({ ...row, email: e.target.value })} className={input()} /></div>
        </div>
      )}
    </div>
  );
}

/** Team members are added by NIM. A Hub user is confirmed by first name and major only. */
export default function TeamMembers({ rows, onChange, ownNim, error }: { rows: MemberRow[]; onChange: (r: MemberRow[]) => void; ownNim: string | null; error?: string }) {
  return (
    <div className="space-y-2">
      {rows.map((r, i) => <Row key={i} index={i} row={r} own={ownNim ? normalizeNim(ownNim) : null} onChange={(n) => onChange(rows.map((x, j) => (j === i ? n : x)))} onRemove={() => onChange(rows.filter((_, j) => j !== i))} />)}
      {rows.length < 4 && (
        <button type="button" onClick={() => onChange([...rows, { nim: "", name: "", email: "" }])} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 text-sm font-medium text-brand-700 hover:border-brand-500">
          <Plus className="h-4 w-4" aria-hidden="true" /> Tambah anggota
        </button>
      )}
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
