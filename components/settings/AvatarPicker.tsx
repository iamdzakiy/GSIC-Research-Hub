"use client";
// Photo upload with a square crop (drag to move, slider to zoom), or one of 12 GSIC presets.
import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import Avatar from "@/components/hub/Avatar";
import { btnPrimary, btnSecondary } from "@/components/hub/buttons";
import { cn } from "@/lib/cn";

const PRESETS = Array.from({ length: 12 }, (_, i) => `/avatars/gsic-${String(i + 1).padStart(2, "0")}.svg`);
const BOX = 240;

export default function AvatarPicker({ name, current, onUpload, onPreset }: { name: string; current: string | null; onUpload: (b: Blob) => Promise<void>; onPreset: (url: string | null) => Promise<void> }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const base = img ? BOX / Math.min(img.width, img.height) : 1;
  const scale = base * zoom;
  const clamp = (o: { x: number; y: number }) => {
    if (!img) return o;
    const mx = Math.max(0, (img.width * scale - BOX) / 2), my = Math.max(0, (img.height * scale - BOX) / 2);
    return { x: Math.min(mx, Math.max(-mx, o.x)), y: Math.min(my, Math.max(-my, o.y)) };
  };

  useEffect(() => {
    const c = canvas.current?.getContext("2d");
    if (!c || !img) return;
    c.clearRect(0, 0, BOX, BOX);
    const w = img.width * scale, h = img.height * scale;
    c.drawImage(img, (BOX - w) / 2 + off.x, (BOX - h) / 2 + off.y, w, h);
  }, [img, scale, off]);

  function pick(f?: File) {
    setErr("");
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return setErr("Use a JPG, PNG or WebP image.");
    if (f.size > 8 * 1024 * 1024) return setErr("That image is over 8 MB.");
    const url = URL.createObjectURL(f);
    const i = new Image();
    i.onload = () => { setImg(i); setZoom(1); setOff({ x: 0, y: 0 }); URL.revokeObjectURL(url); };
    i.src = url;
  }

  async function save() {
    if (!img) return;
    const out = document.createElement("canvas");
    out.width = out.height = 512;
    const k = 512 / BOX, w = img.width * scale * k, h = img.height * scale * k;
    out.getContext("2d")!.drawImage(img, (512 - w) / 2 + off.x * k, (512 - h) / 2 + off.y * k, w, h);
    const blob = await new Promise<Blob | null>((r) => out.toBlob(r, "image/webp", 0.88));
    if (!blob) return setErr("Your browser could not prepare the image.");
    setBusy(true);
    try { await onUpload(blob); setImg(null); } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed."); } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        {img ? (
          <canvas ref={canvas} width={BOX} height={BOX} aria-label="Drag to position your photo"
            className="cursor-grab touch-none rounded-full ring-4 ring-brand-100 active:cursor-grabbing"
            onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }; }}
            onPointerMove={(e) => { const d = drag.current; if (d) setOff(clamp({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y })); }}
            onPointerUp={() => { drag.current = null; }} />
        ) : <Avatar name={name} src={current} size={160} className="ring-4 ring-brand-100" />}
        {img && (
          <label className="flex w-full items-center gap-2 text-xs text-ink-3">Zoom
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => { setZoom(+e.target.value); setOff((o) => clamp(o)); }} className="flex-1 accent-brand-600" />
          </label>
        )}
      </div>
      <div>
        {img ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={busy} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Use this photo</button>
            <button type="button" onClick={() => setImg(null)} className={btnSecondary}>Cancel</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <label className={cn(btnSecondary, "cursor-pointer")}><Upload className="h-4 w-4" aria-hidden="true" />Upload a photo<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} /></label>
            {current && <button type="button" onClick={() => onPreset(null)} className="h-11 px-2 text-sm font-medium text-ink-3 underline hover:text-ink">Remove</button>}
          </div>
        )}
        {err && <p role="alert" className="mt-2 text-sm text-rose-700">{err}</p>}
        <p className="mt-5 text-sm font-medium text-ink">Or pick one</p>
        <ul className="mt-2 grid grid-cols-6 gap-2 sm:max-w-sm">
          {PRESETS.map((p) => (
            <li key={p}>
              <button type="button" onClick={() => onPreset(p)} aria-label="Use this avatar" aria-pressed={current === p}
                className={cn("block overflow-hidden rounded-full ring-offset-2 transition-transform hover:scale-105", current === p && "ring-2 ring-brand-600")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" width={48} height={48} className="h-12 w-12" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
