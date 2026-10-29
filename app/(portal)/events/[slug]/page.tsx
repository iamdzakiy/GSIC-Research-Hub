import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Users, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { eventTime, eventWhen } from "@/lib/event-links";
import EventRegister from "@/components/events/EventRegister";

export const dynamic = "force-dynamic";
type Props = { params: { slug: string } };

const MODE: Record<string, string> = { online: "Daring", onsite: "Tatap muka", hybrid: "Hibrida" };
interface Mod { id?: string; title: string; description?: string; dateLabel?: string; durationHours?: number }
interface Spk { id?: string; name: string; roleTitle?: string; institution?: string }

const load = (slug: string) =>
  prisma.event.findFirst({ where: { OR: [{ slug }, { id: slug }] } }).catch(() => null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await load(decodeURIComponent(params.slug));
  return e ? { title: `${e.title} · GSIC Hub`, description: e.shortDescription } : { title: "Event not found · GSIC Hub" };
}

export default async function EventPage({ params }: Props) {
  const e = await load(decodeURIComponent(params.slug));
  if (!e) notFound();

  const modules = (Array.isArray(e.modules) ? e.modules : []) as unknown as Mod[];
  const speakers = (Array.isArray(e.speakers) ? e.speakers : []) as unknown as Spk[];
  const seatsLeft = Math.max(0, e.maxParticipants - e.currentParticipants);
  const exact = !e.dateLabel;
  const now = new Date();
  const closed =
    !e.registrationOpen ? "Pendaftaran belum dibuka." :
    e.status === "completed" || e.status === "archived" ? "Acara ini sudah selesai." :
    now > e.registrationDeadline ? "Pendaftaran sudah ditutup." :
    seatsLeft === 0 ? "Kuota penuh." : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Semua program</Link>

      <header className="mt-5">
        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold capitalize text-brand-700">{e.type}</span>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{e.title}</h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600">{e.shortDescription}</p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />{eventWhen(e)}{exact && `, ${eventTime(e.startDate)}–${eventTime(e.endDate)} WIB`}</li>
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />{e.location}</li>
          <li className="flex items-center gap-2"><Video className="h-4 w-4 text-slate-400" aria-hidden="true" />{MODE[e.mode] ?? e.mode}</li>
          <li className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" aria-hidden="true" />{seatsLeft} dari {e.maxParticipants} kursi tersisa</li>
        </ul>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          <section aria-labelledby="tentang">
            <h2 id="tentang" className="font-heading text-lg font-bold text-slate-900">Tentang acara</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-700">{e.description}</p>
          </section>

          {modules.length > 0 && (
            <section aria-labelledby="agenda">
              <h2 id="agenda" className="font-heading text-lg font-bold text-slate-900">{e.type === "bootcamp" ? "Episode" : "Rangkaian acara"}</h2>
              <ol className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {modules.map((m, i) => (
                  <li key={m.id ?? i} className="flex gap-4 px-5 py-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                      {m.description && <p className="mt-0.5 text-sm text-slate-600">{m.description}</p>}
                      {(m.dateLabel || m.durationHours) ? <p className="mt-1 text-xs text-slate-500">{[m.dateLabel, m.durationHours ? `${m.durationHours} jam` : ""].filter(Boolean).join(" · ")}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {speakers.length > 0 && (
            <section aria-labelledby="panelis">
              <h2 id="panelis" className="font-heading text-lg font-bold text-slate-900">Panelis</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {speakers.map((s, i) => (
                  <li key={s.id ?? i} className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                    <p className="text-sm text-slate-600">{[s.roleTitle, s.institution].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(e.hasPreTest || e.hasPostTest) && (
            <section aria-labelledby="tes">
              <h2 id="tes" className="font-heading text-lg font-bold text-slate-900">Pra-tes dan pasca-tes</h2>
              {e.preTestExplanation && <p className="mt-3 text-[15px] leading-7 text-slate-700">{e.preTestExplanation}</p>}
              {e.postTestExplanation && <p className="mt-2 text-[15px] leading-7 text-slate-700">{e.postTestExplanation}</p>}
            </section>
          )}
        </div>

        <aside className="self-start lg:sticky lg:top-24">
          <EventRegister
            event={{ id: e.id, slug: e.slug ?? e.id, type: e.type, title: e.title, mode: e.mode }}
            closedReason={closed}
          />
        </aside>
      </div>
    </main>
  );
}
