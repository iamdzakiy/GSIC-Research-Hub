import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { buildRaporV3 } from "@/lib/rapor";
import { siteUrl } from "@/lib/supabaseAdmin";
import { makeCode } from "@/lib/assessments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Certificate of participation as a PNG. Only when the event has certificates on and the person finished everything (post-test and survey, all four episodes for the Bootcamp). */
export const GET = withErrorHandler(async (request: Request, { params }: { params: { eventId: string } }) => {
  const user = await requireUser(request);
  const event = await prisma.event.findFirst({ where: { OR: [{ id: params.eventId }, { slug: params.eventId }] } });
  if (!event || !event.certificateEnabled) throw new HttpError(404, "There is no certificate for this event.");
  if (!user.nim || !user.name) throw new HttpError(409, "Add your name and NIM to your profile first.");

  const [regs, tests, results] = await Promise.all([
    prisma.registration.findMany({ where: { userId: user.id, eventId: event.id, status: { notIn: ["cancelled", "waitlisted"] } } }),
    prisma.test.findMany({ where: { eventId: event.id } }),
    prisma.testResult.findMany({ where: { userId: user.id, test: { eventId: event.id } } }),
  ]);
  const rapor = buildRaporV3(regs, [{ id: event.id, slug: event.slug, title: event.title, type: event.type, startDate: event.startDate, location: event.location }], tests, results);
  if (rapor.events[0]?.stage !== "completed") throw new HttpError(403, "Finish the post-test and the survey (every episode for the Bootcamp) to get your certificate.");

  let cert = await prisma.certificate.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } } });
  for (let i = 0; !cert && i < 5; i++) {
    try { cert = await prisma.certificate.create({ data: { userId: user.id, eventId: event.id, code: makeCode() } }); } catch { /* a code clash: try another */ }
  }
  if (!cert) throw new HttpError(500, "Could not issue the certificate. Try again.");

  const when = (event.endDate ?? cert.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  const verify = `${siteUrl(request)}/verify/${cert.code}`.replace(/^https?:\/\//, "");
  const img = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff", padding: 72, border: "14px solid #3352cd" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, letterSpacing: 6, color: "#3352cd", textTransform: "uppercase" }}>GSIC ITB</div>
          <div style={{ fontSize: 72, fontWeight: 700, color: "#0b1f3a", marginTop: 24 }}>Sertifikat Partisipasi</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, color: "#475569" }}>diberikan kepada</div>
          <div style={{ fontSize: 76, fontWeight: 700, color: "#0b1f3a", marginTop: 10 }}>{user.name}</div>
          <div style={{ fontSize: 32, color: "#475569", marginTop: 8 }}>NIM {user.nim}</div>
          <div style={{ fontSize: 30, color: "#475569", marginTop: 36 }}>atas partisipasinya dalam</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: "#3352cd", marginTop: 8 }}>{event.title}</div>
          <div style={{ fontSize: 28, color: "#475569", marginTop: 12 }}>{when}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#475569" }}>
          <div>Kode verifikasi: {cert.code}</div>
          <div>{verify}</div>
        </div>
      </div>
    ),
    { width: 1600, height: 1130 },
  );
  return new NextResponse(await img.arrayBuffer(), { headers: { "Content-Type": "image/png", "Content-Disposition": `inline; filename="sertifikat-${cert.code}.png"`, "Cache-Control": "private, no-store" } });
});
