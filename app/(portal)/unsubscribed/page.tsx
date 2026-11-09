import type { Metadata } from "next";
import Link from "next/link";
import { NOTIFY_KINDS, isNotifyKind } from "@/lib/notify-kinds";
import CampusSilhouette from "@/components/hub/CampusSilhouette";
import { btnPrimary, btnSecondary } from "@/components/hub/buttons";

export const metadata: Metadata = { title: "Email preferences · GSIC Hub", robots: { index: false } };

export default function UnsubscribedPage({ searchParams }: { searchParams: { k?: string; error?: string } }) {
  const ok = !searchParams.error && isNotifyKind(searchParams.k);
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <p className="label-mono text-brand-700">Email preferences</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">{ok ? "You are unsubscribed" : "That link did not work"}</h1>
      <p className="mt-3 text-[15px] leading-7 text-ink-2">
        {ok ? <>You will no longer get emails for <strong className="text-ink">{NOTIFY_KINDS[searchParams.k as keyof typeof NOTIFY_KINDS].label.toLowerCase()}</strong>. Other emails stay as they are.</> : "The link may be old or incomplete. You can change every email setting after signing in."}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link href="/settings#notifications" className={btnPrimary}>Manage all email settings</Link>
        <Link href="/" className={btnSecondary}>Go to the hub</Link>
      </div>
      <CampusSilhouette draw className="mt-14 text-slate-300" strokeWidth={1.2} />
    </main>
  );
}
