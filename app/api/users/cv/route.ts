import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CV_BUCKET, CV_MAX_BYTES, ensureCvBucket, profileResponse } from "@/lib/cv";
import { syncProfileToSheet } from "@/lib/matchmaking-sheet";

export const runtime = "nodejs";

const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

/** Upload (or replace) the signed-in user's CV: a PDF of at most 5 MB, stored in a private bucket. */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const file = (await request.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return fail(400, "Attach a PDF in the \"file\" field.");
  if (file.size > CV_MAX_BYTES) return fail(413, "Your CV must be 5 MB or smaller.");
  const buf = Buffer.from(await file.arrayBuffer());
  if (file.type !== "application/pdf" || buf.subarray(0, 5).toString("ascii") !== "%PDF-") return fail(415, "Your CV must be a PDF.");

  await ensureCvBucket();
  const path = `${user.id}/cv.pdf`;
  const { error } = await supabaseAdmin().storage.from(CV_BUCKET).upload(path, buf, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  const saved = await prisma.user.update({ where: { id: user.id }, data: { cvPath: path } });
  await syncProfileToSheet(user.id);
  return NextResponse.json({ ok: true, profile: await profileResponse(saved) });
});

export const DELETE = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  if (user.cvPath) await supabaseAdmin().storage.from(CV_BUCKET).remove([user.cvPath]);
  const saved = await prisma.user.update({ where: { id: user.id }, data: { cvPath: null } });
  await syncProfileToSheet(user.id);
  return NextResponse.json({ ok: true, profile: await profileResponse(saved) });
});
