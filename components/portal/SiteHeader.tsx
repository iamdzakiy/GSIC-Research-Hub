"use client";

import Link from "next/link";
import BrandMark from "@/components/portal/BrandMark";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import Avatar from "@/components/hub/Avatar";
import NotificationBell from "@/components/hub/NotificationBell";
import SearchPalette, { openSearch } from "@/components/hub/SearchPalette";

const MAIN = [
  { href: "/competitions", label: "Competitions" },
  { href: "/partners", label: "Seeking Partner" },
  { href: "/members", label: "Members" },
  { href: "/events", label: "Events" },
  { href: "/pkm", label: "PKM" },
];
const MORE = [
  { href: "/opportunities", label: "Scholarships and other opportunities" },
  { href: "/links", label: "Links, SIX and Edunex" },
  { href: "/blog", label: "Blog" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About GSIC" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const linkCls = (href: string) =>
    cn("relative rounded-md px-3 py-2 text-sm font-medium transition-colors", isActive(href) ? "text-ink after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:bg-brand-600" : "text-ink-3 hover:text-ink");

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/85">
      <SearchPalette />
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="GSIC Hub home">
          <BrandMark size={32} />
          <span className="font-display text-base font-bold tracking-tight text-navy">GSIC <span className="font-medium text-ink-3">Hub</span></span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {MAIN.map((l) => <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={linkCls(l.href)}>{l.label}</Link>)}
          <div className="group relative">
            <button type="button" aria-haspopup="true" className={cn(linkCls("/__more"), "inline-flex items-center gap-1")}>More <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /></button>
            <ul className="invisible absolute left-0 top-full z-50 w-64 rounded-xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              {MORE.map((t) => <li key={t.href}><Link href={t.href} className="block rounded-md px-3 py-2 text-sm text-ink-2 hover:bg-paper hover:text-ink">{t.label}</Link></li>)}
            </ul>
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={openSearch} className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 bg-paper px-3 text-sm text-ink-3 hover:border-slate-300 sm:inline-flex" aria-label="Search">
            <Search className="h-4 w-4" aria-hidden="true" /><span className="hidden xl:inline">Search</span><kbd className="label-mono hidden rounded border border-slate-200 bg-white px-1 text-[10px] xl:inline">Ctrl K</kbd>
          </button>
          <button type="button" onClick={openSearch} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 hover:bg-slate-100 sm:hidden" aria-label="Search"><Search className="h-[18px] w-[18px]" aria-hidden="true" /></button>
          {loading ? <span className="h-9 w-24" /> : user ? (
            <>
              <NotificationBell />
              <div ref={menuRef} className="relative hidden lg:block">
                <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Account menu" className="flex items-center gap-1.5 rounded-full p-0.5 hover:bg-slate-100">
                  <Avatar name={userProfile?.name} src={userProfile?.avatarUrl} size={32} />
                  <ChevronDown className="mr-1 h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
                </button>
                {menu && (
                  <ul className="pop absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    <li className="truncate px-3 pb-2 pt-1.5 text-xs text-ink-3">{userProfile?.email ?? user.email}</li>
                    {[["/dashboard", "Dashboard"], ["/partners/manage", "My partner posts"], ["/settings", "Settings"]].map(([h, l]) => <li key={h}><Link href={h!} className="block rounded-md px-3 py-2 text-sm text-ink-2 hover:bg-paper hover:text-ink">{l}</Link></li>)}
                    {userProfile?.role === "admin" && <li><Link href="/admin" className="block rounded-md px-3 py-2 text-sm text-ink-2 hover:bg-paper">Admin</Link></li>}
                    <li className="mt-1 border-t border-slate-100 pt-1"><button type="button" onClick={() => supabase.auth.signOut()} className="block w-full rounded-md px-3 py-2 text-left text-sm text-ink-2 hover:bg-paper">Sign out</button></li>
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-1.5 lg:flex">
              <Link href="/auth?mode=signin" className="rounded-md px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink">Sign in</Link>
              <Link href="/auth?mode=signup" className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Join the hub</Link>
            </div>
          )}
          <button type="button" className="rounded-md p-2 text-ink-2 hover:bg-slate-100 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-0.5">
            {[{ href: "/", label: "Home" }, ...MAIN, ...MORE].map((l) => <Link key={l.href} href={l.href} className={cn("rounded-md px-3 py-2.5 text-sm font-medium", isActive(l.href) ? "bg-brand-50 text-brand-700" : "text-ink-2")}>{l.label}</Link>)}
            {user && <Link href="/settings" className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-2">Settings</Link>}
            <div className="mt-2 flex gap-2 border-t border-slate-200 pt-3">
              {user ? (
                <button type="button" onClick={() => supabase.auth.signOut()} className="h-10 flex-1 rounded-lg border border-slate-300 text-sm font-medium text-ink-2">Sign out</button>
              ) : (
                <>
                  <Link href="/auth?mode=signin" className="flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-300 text-sm font-medium text-ink-2">Sign in</Link>
                  <Link href="/auth?mode=signup" className="flex h-10 flex-1 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white">Join the hub</Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
