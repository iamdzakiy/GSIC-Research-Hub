"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/apiFetch";
import { NIM_TAKEN, UNKNOWN_CODE_HELP, detectedLabel, isItb, nimError, nimLabel, normalizeNim, parseNim, storedNim } from "@/lib/nim";

export type NimAvailability = "idle" | "checking" | "available" | "taken";

interface Props {
  institution: string;
  value: string;
  onChange: (next: string) => void;
  /** Error from the server or the form schema. Local blur validation shows first. */
  error?: string;
  onAvailability?: (state: NimAvailability) => void;
  /** Skip the availability check (the one-field sheet checks on save). */
  hint?: string;
}

/**
 * NIM input. Numeric keyboard on mobile, paste strips spaces and dots, "5/8" counter while typing,
 * validation on blur that clears as soon as the value is valid, and a debounced uniqueness check.
 */
export default function NimField({ institution, value, onChange, error, onAvailability, hint }: Props) {
  const id = useId();
  const itb = isItb(institution);
  const label = nimLabel(institution);
  const [blurred, setBlurred] = useState(false);
  const [avail, setAvail] = useState<NimAvailability>("idle");
  const onAvailRef = useRef(onAvailability);
  onAvailRef.current = onAvailability;

  const local = value ? nimError(institution, value) : null;
  const info = itb && !local && value ? parseNim(value) : null;
  const shown = (blurred && local) || (!local ? error : null) || null;

  // Debounced, rate-limited uniqueness check. Only runs for a value that is already well formed.
  useEffect(() => {
    const set = (s: NimAvailability) => { setAvail(s); onAvailRef.current?.(s); };
    if (!value || local) { set("idle"); return; }
    set("checking");
    let live = true;
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/users/nim-available?nim=${encodeURIComponent(storedNim(institution, value))}&institution=${encodeURIComponent(institution)}`);
        const b = (await res.json().catch(() => null)) as { available?: boolean } | null;
        if (live) set(res.ok && typeof b?.available === "boolean" ? (b.available ? "available" : "taken") : "idle");
      } catch { if (live) set("idle"); }
    }, 500);
    return () => { live = false; clearTimeout(t); };
  }, [value, institution, local]);

  const max = itb ? 8 : 20;
  const digits = normalizeNim(value).length;
  const err = shown ?? (avail === "taken" ? NIM_TAKEN : null);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          id={id} name="nim" value={value} autoComplete="off" spellCheck={false}
          inputMode={itb ? "numeric" : "text"} pattern={itb ? "[0-9]*" : undefined} maxLength={itb ? 14 : 24}
          onChange={(e) => onChange(itb ? e.target.value.replace(/[^\d\s.\-]/g, "") : e.target.value)}
          onPaste={(e) => { e.preventDefault(); onChange(normalizeNim(e.clipboardData.getData("text")).slice(0, itb ? 8 : 20)); }}
          onBlur={() => setBlurred(true)}
          placeholder={itb ? "e.g. 10423001" : "As on your student card"}
          aria-invalid={!!err} aria-describedby={`${id}-help`}
          className={cn("h-11 w-full rounded-lg border bg-white pl-3.5 pr-16 text-sm tabular-nums text-slate-900 focus:outline-none focus:ring-2", err ? "border-danger focus:ring-danger/20" : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20")}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-xs tabular-nums text-ink-3" aria-hidden="true">
          {avail === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {avail === "available" && <Check className="h-3.5 w-3.5 text-success-700" />}
          {digits}/{max}
        </span>
      </div>
      <div id={`${id}-help`} className="min-h-[1.25rem]">
        {err ? <p role="alert" className="err-slot">{err}</p> : (
          <p className="mt-1.5 text-xs text-ink-3">
            {info?.faculty ? <span className="fade-in inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 font-medium text-brand-700">{detectedLabel(info)}</span>
              : info ? <span className="fade-in">{UNKNOWN_CODE_HELP}</span>
              : hint ?? (itb ? "8 digits. The first three are your program code and the next two your intake year." : "4 to 20 letters and digits.")}
          </p>
        )}
      </div>
    </div>
  );
}
