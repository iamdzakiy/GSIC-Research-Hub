import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LiveBoard from "@/components/assess/LiveBoard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live", robots: { index: false } };

/** Projector view: the QR code, the short link and the live count. No answers, no names. */
export default async function Live({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const t = await prisma.test.findUnique({ where: { code }, select: { title: true } });
  if (!t) notFound();
  const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").replace(/\/$/, "");
  return <LiveBoard code={code} title={t.title} site={site} />;
}
