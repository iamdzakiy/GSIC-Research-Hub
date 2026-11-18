"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import NimField, { type NimAvailability } from "@/components/portal/NimField";
import { updateUserProfile } from "@/services/userService";
import { NIM_TAKEN, nimError, nimLabel } from "@/lib/nim";

/** One-field sheet for existing accounts that signed up before the NIM was required. */
export function NimSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { user, userProfile, refreshProfile } = useAuth();
  const institution = userProfile?.institution || "ITB";
  const [value, setValue] = useState("");
  const [avail, setAvail] = useState<NimAvailability>("idle");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLInputElement>("input")?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); prev?.focus(); };
  }, [open, onClose]);

  if (!open) return null;

  async function save() {
    const problem = nimError(institution, value);
    if (problem) return setErr(problem);
    if (avail === "taken") return setErr(NIM_TAKEN);
    if (!user) return;
    setBusy(true); setErr("");
    try {
      await updateUserProfile(user.id, { nim: value, institution });
      await refreshProfile();
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="nim-sheet-title" className="sheet-in w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="nim-sheet-title" className="font-display text-lg font-bold text-slate-900">Add your {nimLabel(institution)}</h2>
            <p className="mt-1 text-sm text-slate-600">We need it to register you for events and to link your test results. Only you and the GSIC team can see it.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1.5 text-slate-500 hover:text-slate-800"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <form className="mt-5" onSubmit={(e) => { e.preventDefault(); void save(); }} noValidate>
          <NimField institution={institution} value={value} onChange={setValue} error={err} onAvailability={setAvail} />
          <button type="submit" disabled={busy} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-70">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Save
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * `ensureNim()` resolves true at once when the account has a NIM. Otherwise it opens the sheet and
 * resolves true after the person saves it, false if they close it. Render `sheet` once in the page.
 */
export function useNimGate(): { hasNim: boolean; ensureNim: () => Promise<boolean>; sheet: ReactNode } {
  const { userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const hasNim = !!userProfile?.nim;

  const finish = useCallback((ok: boolean) => { setOpen(false); resolver.current?.(ok); resolver.current = null; }, []);
  const ensureNim = useCallback(() => {
    if (hasNim) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; setOpen(true); });
  }, [hasNim]);

  return { hasNim, ensureNim, sheet: <NimSheet open={open} onClose={() => finish(false)} onSaved={() => finish(true)} /> };
}

/** Dashboard banner for accounts without a NIM. */
export function NimBanner() {
  const { userProfile, loading } = useAuth();
  const gate = useNimGate();
  if (loading || !userProfile || gate.hasNim) return null;
  return (
    <>
      <div role="region" aria-label="Add your NIM" className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Add your {nimLabel(userProfile.institution)}</p>
          <p className="text-sm text-slate-600">You need it before you can register for an event or start a test.</p>
        </div>
        <button type="button" onClick={() => void gate.ensureNim()} className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Add it now</button>
      </div>
      {gate.sheet}
    </>
  );
}
