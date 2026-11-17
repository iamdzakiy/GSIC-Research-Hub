import { prisma } from "@/lib/prisma";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify a certificate", robots: { index: false } };

/** Confirms a certificate is real. Shows the name and the event, nothing else (no NIM, no email). */
export default async function Verify({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const cert = /^[A-Z0-9]{6}$/.test(code) ? await prisma.certificate.findUnique({ where: { code }, include: { user: { select: { name: true } } } }) : null;
  const event = cert ? await prisma.event.findUnique({ where: { id: cert.eventId }, select: { title: true } }) : null;
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      {cert && event ? (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-mint-700" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">This certificate is real</h1>
          <p className="mt-4 text-sm text-ink-3">Issued to</p>
          <p className="font-display text-xl font-semibold text-ink">{cert.user.name}</p>
          <p className="mt-3 text-sm text-ink-3">For</p>
          <p lang="id" className="font-semibold text-ink">{event.title}</p>
        </div>
      ) : (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8">
          <XCircle className="mx-auto h-12 w-12 text-rose-600" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">We could not find this certificate</h1>
          <p className="mt-2 text-sm text-ink-3">Check the code printed on it. It has six characters.</p>
        </div>
      )}
    </main>
  );
}
