"use client";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import RaporView from "@/components/portal/rapor/RaporView";

export default function RaporPage() {
  const { user, loading } = useAuth();
  return (
    <>
      <header className="bg-navy text-white print:hidden">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-mint">Rapor belajar</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Perkembangan Anda di setiap kegiatan</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">Bandingkan hasil pre-test dan post-test untuk melihat seberapa jauh Anda berkembang.</p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {loading ? <div className="h-40 animate-pulse rounded-xl bg-white" /> : !user ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-900">Masuk untuk melihat rapor Anda</p>
            <Link href="/auth?mode=signin&next=/rapor" className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Masuk</Link>
          </div>
        ) : <RaporView />}
      </main>
    </>
  );
}
