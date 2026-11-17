"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { useAuth } from "@/components/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import type { SaveState } from "@/components/motion/SaveStatus";
import { pickNewer, readLocal, usableDraft, writeLocal, draftStorageKey, type StoredDraft } from "@/lib/form-draft";

const SERVER_DELAY_MS = 1500;

export interface FormDraftApi<T extends Record<string, unknown>> {
  /** False until the stored copies have been read. Render the form after this. */
  ready: boolean;
  /** Set when a draft was found and applied, so the UI can say so. */
  restored: { savedAt: number } | null;
  /** The restored fields (partial). Merge into the form's own defaults once `ready` is true. */
  initial: Partial<T> | null;
  initialStep: number;
  status: SaveState;
  /** Call on every change. Saves to this device at once and to the server after 1.5 s of quiet. */
  save: (data: T, step: number) => void;
  /** Removes both copies (after a successful submit, or when the person discards it). */
  clear: () => Promise<void>;
}

/**
 * One draft per signed-in person and form key. The newer of the device copy and the server copy wins.
 * `schema` is checked with its `.partial()`, and a draft is never treated as a submission.
 */
export function useFormDraft<T extends Record<string, unknown>>(formKey: string, schema: z.ZodTypeAny): FormDraftApi<T> {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState<{ savedAt: number } | null>(null);
  const [initial, setInitial] = useState<Partial<T> | null>(null);
  const [initialStep, setInitialStep] = useState(1);
  const [status, setStatus] = useState<SaveState>("idle");
  const latest = useRef<StoredDraft | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const cleared = useRef(false);

  const pushToServer = useCallback(async () => {
    const d = latest.current;
    if (!d || !userId || cleared.current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) { setStatus("offline"); return; }
    setStatus("saving");
    try {
      const res = await apiFetch(`/api/drafts/${encodeURIComponent(formKey)}`, { method: "PUT", body: JSON.stringify({ data: d.data, step: d.step }) });
      if (cleared.current) return;
      if (res.ok) { dirty.current = false; setStatus("saved"); }
      else setStatus(res.status >= 500 ? "offline" : "error");
    } catch { setStatus("offline"); }
  }, [formKey, userId]);

  // Load and restore.
  useEffect(() => {
    if (!userId) { setReady(true); return; }
    let live = true;
    cleared.current = false;
    (async () => {
      const local = readLocal(window.localStorage, userId, formKey);
      let server: StoredDraft | null = null;
      try {
        const res = await apiFetch(`/api/drafts/${encodeURIComponent(formKey)}`);
        const b = (await res.json().catch(() => null)) as { draft?: { data: Record<string, unknown>; step: number; updatedAt: string } | null } | null;
        if (res.ok && b?.draft) server = { data: b.draft.data, step: b.draft.step, savedAt: Date.parse(b.draft.updatedAt) };
      } catch { /* offline: the device copy is used */ }
      if (!live) return;
      const win = pickNewer(local, server);
      const data = win && usableDraft(schema, win.data);
      if (win && data) {
        setInitial(data as Partial<T>);
        setInitialStep(win.step);
        setRestored({ savedAt: win.savedAt });
        latest.current = { data, step: win.step, savedAt: win.savedAt };
        // The device copy was newer, so the server is behind. Catch it up quietly.
        if (win === local && local && (!server || local.savedAt > server.savedAt)) { dirty.current = true; void pushToServer(); }
      }
      setReady(true);
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, formKey]);

  const save = useCallback((data: T, step: number) => {
    if (!userId || cleared.current) return;
    const d: StoredDraft = { data, step, savedAt: Date.now() };
    latest.current = d;
    dirty.current = true;
    writeLocal(window.localStorage, userId, formKey, d);
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void pushToServer(), SERVER_DELAY_MS);
  }, [userId, formKey, pushToServer]);

  // Retry when the connection returns, and flush when the tab is hidden.
  useEffect(() => {
    const online = () => { if (dirty.current) void pushToServer(); };
    const hide = () => { if (document.visibilityState === "hidden" && dirty.current && timer.current) { clearTimeout(timer.current); void pushToServer(); } };
    window.addEventListener("online", online);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("online", online); document.removeEventListener("visibilitychange", hide); if (timer.current) clearTimeout(timer.current); };
  }, [pushToServer]);

  const clear = useCallback(async () => {
    cleared.current = true;
    dirty.current = false;
    if (timer.current) clearTimeout(timer.current);
    latest.current = null;
    setStatus("idle");
    setRestored(null);
    if (!userId) return;
    try { window.localStorage.removeItem(draftStorageKey(userId, formKey)); } catch { /* ignore */ }
    try { await apiFetch(`/api/drafts/${encodeURIComponent(formKey)}`, { method: "DELETE" }); } catch { /* the server copy expires with the next save */ }
  }, [userId, formKey]);

  return { ready, restored, initial, initialStep, status, save, clear };
}

/**
 * Keeps a controlled form in step with its draft. Once the stored draft has been read it is handed to `apply`
 * (once), and from then on every change to `value` is saved. A form that is still blank is never saved.
 */
export function useDraftedForm<T extends Record<string, unknown>>(
  formKey: string,
  schema: z.ZodTypeAny,
  value: T,
  apply: (restored: Partial<T>) => void,
  opts: { enabled?: boolean } = {},
) {
  const draft = useFormDraft<T>(formKey, schema);
  const enabled = opts.enabled !== false;
  const blank = useRef<string | null>(null);
  const applied = useRef(false);
  const json = JSON.stringify(value);
  const applyRef = useRef(apply); applyRef.current = apply;
  if (enabled && blank.current === null) blank.current = json;

  useEffect(() => {
    if (!enabled || !draft.ready || applied.current) return;
    applied.current = true;
    blank.current = json; // whatever the form holds now (defaults, or the loaded profile) is the baseline
    if (draft.initial) applyRef.current(draft.initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, draft.ready, draft.initial]);

  const lastSaved = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || !applied.current || json === blank.current || json === lastSaved.current) return;
    lastSaved.current = json;
    draft.save(JSON.parse(json) as T, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, json]);

  return { status: draft.status, restored: draft.restored, clear: draft.clear, ready: draft.ready };
}
