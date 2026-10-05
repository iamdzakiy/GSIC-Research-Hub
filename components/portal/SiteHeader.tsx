"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const TYPES = [
  { href: "/opportunities", label: "Semua peluang" },
  { href: "/opportunities?type=scholarship", label: "Beasiswa" },
  { href: "/opportunities?type=competition", label: "Kompetisi" },
  { href: "/opportunities?type=research", label: "Research Grant" },
  { href: "/opportunities?type=career", label: "Karier & Magang" },
];
const LINKS = [
  { href: "/links", label: "Pranala" },
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Events" },
  { href: "/documents", label: "Resources" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]!));
  const linkCls = (href: string) =>
    cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", isActive(href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900");

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="GSIC Hub — beranda">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white font-heading">G</span>
          <span className="text-base font-bold tracking-tight text-navy font-heading">GSIC <span className="font-medium text-slate-500">Hub</span></span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={linkCls("/")}>Beranda</Link>
          <div className="group relative">
            <Link href="/opportunities" aria-haspopup="true" className={cn(linkCls("/opportunities"), "inline-flex items-center gap-1")}>
              Peluang <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <ul className="invisible absolute left-0 top-full z-50 w-52 rounded-lg border border-slate-200 bg-white p-1.5 opacity-0 shadow-sm transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              {TYPES.map((t) => (
                <li key={t.href}><Link href={t.href} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-cream-100 hover:text-slate-900">{t.label}</Link></li>
              ))}
            </ul>
          </div>
          {LINKS.map((l) => <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={linkCls(l.href)}>{l.label}</Link>)}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Dashboard</Link>
              <button type="button" onClick={() => supabase.auth.signOut()} className="h-9 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Keluar</button>
            </>
          ) : (
            <>
              <Link href="/auth?mode=signin" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Masuk</Link>
              <Link href="/auth?mode=signup" className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Daftar</Link>
            </>
          )}
        </div>

        <button type="button" className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden" aria-label={open ? "Tutup menu" : "Buka menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav aria-label="Navigasi seluler" className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <Link href="/" className={linkCls("/")}>Beranda</Link>
            <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Peluang</p>
            {TYPES.map((t) => <Link key={t.href} href={t.href} className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">{t.label}</Link>)}
            <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Lainnya</p>
            {LINKS.map((l) => <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>)}
            <div className="mt-2 flex gap-2 border-t border-slate-200 pt-3">
              {user ? (
                <button type="button" onClick={() => supabase.auth.signOut()} className="h-10 flex-1 rounded-lg border border-slate-300 text-sm font-medium text-slate-700">Keluar</button>
              ) : (
                <>
                  <Link href="/auth?mode=signin" className="flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-300 text-sm font-medium text-slate-700">Masuk</Link>
                  <Link href="/auth?mode=signup" className="flex h-10 flex-1 items-center justify-center rounded-lg bg-brand-600 text-sm font-medium text-white">Daftar</Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
