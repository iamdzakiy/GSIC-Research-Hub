"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Award, CalendarDays, Settings, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import ProfileEditModal from "@/components/ProfileEditModal";
import RaporView from "@/components/portal/rapor/RaporView";
import JourneyStepper from "@/components/portal/dashboard/JourneyStepper";
import VerifyBanner from "@/components/portal/dashboard/VerifyBanner";
import GalleryMarquee, { type GalleryEntry } from "@/components/portal/GalleryMarquee";
import CountUp from "@/components/portal/CountUp";
import Reveal from "@/components/portal/Reveal";
import { apiFetch } from "@/lib/apiFetch";
import { getDisplayStatus, daysLeft, formatDateId, STATUS_LABEL } from "@/lib/opportunity-status";
import { typeLabel } from "@/lib/opportunity-config";
import type { RaporEvent, RaporSummary } from "@/lib/scoring";
import { cn } from "@/lib/cn";

interface Opp { id: string; slug: string; title: string; organizer: string; type: string; deadline: string; openDate: string | null; status: string }
const TABS = [["ringkasan", "Ringkasan"], ["rapor", "Rapor"], ["peluang", "Peluang"], ["galeri", "Galeri"]] as const;
type Tab = (typeof TABS)[number][0];

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("ringkasan");
  const [edit, setEdit] = useState(false);
  const [rapor, setRapor] = useState<{ events: RaporEvent[]; summary: RaporSummary } | null>(null);
  const [opps, setOpps] = useState<Opp[]>([]);
  const [gallery, setGallery] = useState<GalleryEntry[]>([]);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      const [r, o, g] = await Promise.allSettled([apiFetch("/api/rapor"), fetch("/api/opportunities?pageSize=100"), fetch("/api/gallery")]);
      if (!live) return;
      if (r.status === "fulfilled" && r.value.ok) setRapor(await r.value.json()); else setLoadErr(true);
      if (o.status === "fulfilled" && o.value.ok) setOpps(((await o.value.json()).opportunities ?? []) as Opp[]);
      if (g.status === "fulfilled" && g.value.ok) setGallery(((await g.value.json()).items ?? []) as GalleryEntry[]);
    })();
    return () => { live = false; };
  }, [user]);

  const live = useMemo(() => {
    const now = new Date();
    return opps.map((o) => ({ ...o, display: getDisplayStatus({ deadline: new Date(o.deadline), openDate: o.openDate ? new Date(o.openDate) : null, status: o.status }, now) }))
      .filter((o) => o.display === "open" || o.display === "closing").sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));
  }, [opps]);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-10"><div className="h-40 animate-pulse rounded-2xl bg-white" /></div>;
  if (!user) {
    return (
      <section className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Masuk untuk membuka dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Pantau kegiatan, rapor pre/post-test, dan peluang yang cocok untuk Anda.</p>
        <Link href="/auth?mode=signin&next=/dashboard" className="mt-5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Masuk</Link>
      </section>
    );
  }

  const name = userProfile?.name || user.email?.split("@")[0] || "Peserta";
  const s = rapor?.summary;
  const next = rapor?.events.filter((e) => e.stage !== "completed").slice(0, 3) ?? [];

  return (
    <>
      <header className="relative overflow-hidden bg-navy text-white">
        {!reduce && <motion.div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" animate={{ x: [0, -24, 0], y: [0, 16, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />}
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-8 sm:px-6">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-brand-600 font-display text-2xl font-extrabold">
            {userProfile?.avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={userProfile.avatarUrl} alt="" className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-mint">Dashboard</p>
            <h1 className="truncate font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Halo, {name}</h1>
            <p className="truncate text-sm text-slate-300">{[userProfile?.major, userProfile?.faculty].filter(Boolean).join(" · ") || "Lengkapi profil Anda agar rekomendasi lebih tepat"}</p>
          </div>
          <button type="button" onClick={() => setEdit(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3.5 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"><Settings className="h-4 w-4" aria-hidden="true" /> Edit profil</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <VerifyBanner email={user.email ?? ""} verified={!!user.email_confirmed_at} />
        {loadErr && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">Sebagian data belum bisa dimuat. Muat ulang halaman jika berlanjut.</p>}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { l: "Kegiatan diikuti", v: s?.events ?? 0, suf: "", I: CalendarDays },
            { l: "Rapor lengkap", v: s?.completed ?? 0, suf: "", I: Award },
            { l: "Rata-rata kenaikan", v: s?.avgGain ?? 0, suf: " poin", I: TrendingUp },
            { l: "Peluang dibuka", v: live.length, suf: "", I: Target },
          ].map(({ l, v, suf, I }, i) => (
            <Reveal key={l} delay={i * 0.05}>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><I className="h-5 w-5" aria-hidden="true" /></span>
                <div><p className="font-display text-2xl font-extrabold text-slate-900"><CountUp value={v} suffix={suf} /></p><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{l}</p></div>
              </div>
            </Reveal>
          ))}
        </div>

        <div role="tablist" aria-label="Bagian dashboard" className="flex gap-1 overflow-x-auto border-b border-slate-200">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} onClick={() => setTab(id)}
              className={cn("-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600", tab === id ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800")}>{label}</button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "ringkasan" && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">Perjalanan belajar Anda</h2>
              {!rapor ? <div className="h-32 animate-pulse rounded-xl bg-white" /> : rapor.events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="font-semibold text-slate-900">Belum ada kegiatan</p>
                  <p className="mt-1 text-sm text-slate-500">Daftar ke kegiatan GSIC untuk mulai mengumpulkan rapor.</p>
                  <Link href="/events/pkm-bootcamp" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Lihat kegiatan <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                </div>
              ) : (next.length ? next : rapor.events.slice(0, 2)).map((e, i) => <Reveal key={e.eventId} delay={i * 0.05}><JourneyStepper ev={e} /></Reveal>)}
              {live.length > 0 && (
                <div className="pt-2">
                  <div className="mb-3 flex items-end justify-between"><h2 className="font-display text-lg font-bold text-slate-900">Tenggat terdekat</h2><button type="button" onClick={() => setTab("peluang")} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Lihat semua</button></div>
                  <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                    {live.slice(0, 3).map((o) => (
                      <li key={o.id}><Link href={`/opportunities/${o.slug}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-900">{o.title}</span><span className="block truncate text-xs text-slate-500">{typeLabel(o.type)} · {o.organizer}</span></span><span className="shrink-0 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">{daysLeft(o.deadline)} hari</span></Link></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {tab === "rapor" && <RaporView />}
          {tab === "peluang" && (
            live.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Tidak ada peluang yang sedang dibuka.</p> : (
              <div className="grid gap-3 md:grid-cols-2">
                {live.map((o) => (
                  <Link key={o.id} href={`/opportunities/${o.slug}`} className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
                    <div className="flex items-center justify-between gap-2"><span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{typeLabel(o.type)}</span><span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", o.display === "closing" ? "bg-rose-50 text-rose-700" : "bg-mint-100 text-mint-800")}>{STATUS_LABEL[o.display]}</span></div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{o.title}</p><p className="text-xs text-slate-500">{o.organizer}</p>
                    <p className="mt-2 text-xs text-slate-600">Tenggat {formatDateId(o.deadline)}</p>
                  </Link>
                ))}
              </div>
            )
          )}
          {tab === "galeri" && (gallery.length ? <GalleryMarquee items={gallery} /> : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Galeri akan muncul setelah admin menambahkan foto kegiatan.</p>)}
        </div>
      </main>
      <ProfileEditModal open={edit} onClose={() => setEdit(false)} />
    </>
  );
}
