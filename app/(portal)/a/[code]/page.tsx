import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Test", robots: { index: false } };

/** Short link for a slide: /a/AB12CD goes to the test or survey. */
export default async function ShortLink({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) notFound();
  const t = await prisma.test.findUnique({ where: { code }, select: { id: true, eventId: true } });
  if (!t) notFound();
  const ev = await prisma.event.findUnique({ where: { id: t.eventId }, select: { slug: true } });
  if (!ev?.slug) notFound();
  redirect(`/events/${ev.slug}/tests/${t.id}`);
}
