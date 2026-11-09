"use client";
// Ctrl/⌘K anywhere. Arrow keys move, Enter opens. Empty query shows quick destinations.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/cn";

interface Hit { group: string; title: string; sub?: string; href: string }
const QUICK: Hit[] = [
  { group: "Go to", title: "Competitions closing soon", href: "/competitions?within=7" },
  { group: "Go to", title: "Seeking Partner", href: "/partners" },
  { group: "Go to", title: "Post what you need", href: "/partners/new" },
  { group: "Go to", title: "Events", href: "/events" },
  { group: "Go to", title: "PKM", href: "/pkm" },
  { group: "Go to", title: "SIX ITB", sub: "six.itb.ac.id", href: "https://six.itb.ac.id" },
  { group: "Go to", title: "Edunex ITB", sub: "edunex.itb.ac.id", href: "https://edunex.itb.ac.id" },
];

export function openSearch() { window.dispatchEvent(new Event("gsic:search")); }

export default function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); } };
    const ev = () => setOpen(true);
    window.addEventListener("keydown", key); window.addEventListener("gsic:search", ev);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("gsic:search", ev); };
  }, []);
  useEffect(() => { if (open) { setQ(""); setI(0); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const c = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: c.signal }).then((r) => r.json()).then((b) => { setHits(b.results ?? []); setI(0); }).catch(() => undefined);
    }, 160);
    return () => { clearTimeout(t); c.abort(); };
  }, [q]);

  const list = useMemo(() => (q.trim().length < 2 ? QUICK : hits), [q, hits]);
  const go = (h?: Hit) => {
    if (!h) { if (q.trim()) { setOpen(false); router.push(`/competitions?q=${encodeURIComponent(q.trim())}`); } return; }
    setOpen(false);
    if (h.href.startsWith("http")) window.open(h.href, "_blank", "noopener"); else router.push(h.href);
  };
  if (!open) return null;

  let last = "";
  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center bg-navy/60 p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search" onMouseDown={() => setOpen(false)}>
      <div className="pop w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search className="h-5 w-5 text-ink-3" aria-hidden="true" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search competitions, partners, events"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              else if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(x + 1, list.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); go(list[i]); }
            }}
            className="h-14 flex-1 bg-transparent text-base text-ink placeholder:text-slate-400 focus:outline-none" aria-label="Search" />
          <kbd className="label-mono rounded border border-slate-200 px-1.5 py-0.5 text-ink-3">Esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {list.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-3">No match. Press Enter to search competitions.</li>}
          {list.map((h, n) => {
            const head = h.group !== last; last = h.group;
            return (
              <li key={h.href + n} role="option" aria-selected={n === i}>
                {head && <p className="label-mono px-3 pb-1 pt-3 text-ink-3">{h.group}</p>}
                <button type="button" onMouseEnter={() => setI(n)} onClick={() => go(h)} className={cn("flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left", n === i ? "bg-brand-50" : "")}>
                  <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{h.title}</span>{h.sub && <span className="block truncate text-xs text-ink-3">{h.sub}</span>}</span>
                  {n === i && <CornerDownLeft className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
