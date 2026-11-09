"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/components/hub/useNotifications";
import { cn } from "@/lib/cn";

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
};

export default function NotificationBell() {
  const { unread, items, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => { if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open}
        onClick={() => { setOpen((o) => !o); if (!open) void markRead(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 hover:bg-slate-100 hover:text-ink">
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        {unread > 0 && <span className="pop absolute right-1 top-1 min-w-4 rounded-full bg-brand-600 px-1 text-center text-[10px] font-bold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="pop absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <Link href="/settings#notifications" onClick={() => setOpen(false)} className="text-xs text-ink-3 hover:text-ink">Email settings</Link>
          </div>
          {items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-ink-3">Nothing yet. Responses to your posts and deadline reminders show up here.</p> : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link href={n.url} onClick={() => setOpen(false)} className={cn("block px-4 py-3 hover:bg-paper", !n.readAt && "bg-brand-50/50")}>
                    <span className="flex items-start justify-between gap-3"><span className="text-sm font-medium text-ink">{n.title}</span><span className="tnum shrink-0 text-xs text-ink-3">{ago(n.createdAt)}</span></span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-ink-3">{n.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
