import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_PUBLIC_BUCKET || "blog-images";
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

/** Confirms the bytes really are the claimed image type (a renamed .html must not pass). */
function sniff(buf: Buffer, type: string): boolean {
  const hex = buf.subarray(0, 12).toString("hex");
  if (type === "image/png") return hex.startsWith("89504e47");
  if (type === "image/jpeg") return hex.startsWith("ffd8ff");
  if (type === "image/gif") return hex.startsWith("47494638");
  if (type === "image/webp") return hex.startsWith("52494646") && buf.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  const sb = supabaseAdmin();
  const { error } = await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES, allowedMimeTypes: Object.keys(TYPES) });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
  bucketReady = true;
}

/** Admin-only image upload. Returns { url } pointing at a public Supabase Storage object. */
export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Attach an image in the \"file\" field." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a PNG, JPEG, WebP or GIF image." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Images must be 5 MB or smaller." }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  if (!sniff(buf, file.type)) return NextResponse.json({ error: "The file content does not match its type." }, { status: 415 });

  await ensureBucket();
  const d = new Date();
  const path = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${ext}`;
  const sb = supabaseAdmin();
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
});
