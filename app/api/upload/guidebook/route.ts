import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_GUIDEBOOK_BUCKET || "guidebooks";
const MAX_BYTES = 15 * 1024 * 1024;
let ready = false;

/** Admin-only guidebook PDF upload (public bucket). Returns { url }. */
export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const file = (await request.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Attach a PDF in the \"file\" field." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: "Guidebooks must be 15 MB or smaller." }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.subarray(0, 5).toString("ascii") !== "%PDF-") return NextResponse.json({ ok: false, error: "Upload a PDF." }, { status: 415 });
  const sb = supabaseAdmin();
  if (!ready) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES, allowedMimeTypes: ["application/pdf"] });
    if (error && !/already exists|duplicate/i.test(error.message)) throw error;
    ready = true;
  }
  const path = `${new Date().getUTCFullYear()}/${randomUUID()}.pdf`;
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: "application/pdf", cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return NextResponse.json({ ok: true, url: sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
});
