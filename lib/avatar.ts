// Public avatar storage (Supabase Storage). Uploads are square webp files produced by the client cropper.
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const AVATAR_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || "avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

let ready = false;
export async function ensureAvatarBucket() {
  if (ready) return;
  const { error } = await supabaseAdmin().storage.createBucket(AVATAR_BUCKET, { public: true, fileSizeLimit: AVATAR_MAX_BYTES, allowedMimeTypes: ["image/webp", "image/jpeg", "image/png"] });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
  ready = true;
}

/** Recognises webp, jpeg and png by their first bytes. */
export function sniffImage(buf: Buffer): "image/webp" | "image/jpeg" | "image/png" | null {
  if (buf.length > 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  return null;
}

/** Storage path of an avatar URL we own, so the old file can be removed. */
export function ownAvatarPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}
