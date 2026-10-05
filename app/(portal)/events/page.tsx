import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/opportunity-status";

export const metadata: Metadata = {
  title: "GSIC Programs: PKM Bootcamp and The Sandbox · GSIC Hub",
  description: "GSIC programs: PKM Bootcamp and The Sandbox.",
};

export const dynamic = "force-dynamic";

export default async function EventsIndexPage() {
  const events = await prisma.event
    .findMany({ orderBy: { startDate: "asc" } })
    .catch((e) => {
      console.error("[events-index] DB unavailable:", e);
      return [];
    });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">GSIC Programs</p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-slate-900">All programs</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Research and innovation programs run by GSIC.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold text-slate-900">No programs yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Programs will appear here once an admin adds them.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((e) => (
            <Link
              key={e.id}
              href={e.type === "sandbox" ? "/events/sandbox" : "/events/pkm-bootcamp"}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold capitalize text-brand-700">{e.type}</span>
              <h2 className="mt-3 text-base font-semibold text-slate-900">{e.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{e.shortDescription}</p>
              <ul className="mt-4 space-y-1 text-xs text-slate-500">
                <li className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{formatDate(e.startDate.toISOString())}</li>
                <li className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{e.location}</li>
                <li className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden="true" />{e.currentParticipants}/{e.maxParticipants} participants</li>
              </ul>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                View program <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}