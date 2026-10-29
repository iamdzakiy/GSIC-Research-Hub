// Private CV storage (Supabase Storage, private bucket, signed URLs) and the user-profile response shape.
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { mapPrismaUserToProfile } from "@/services/userService";

export const CV_BUCKET = process.env.SUPABASE_CV_BUCKET || "cvs";
export const CV_MAX_BYTES = 5 * 1024 * 1024;
const SIGNED_TTL_SEC = 60 * 60;

let ready = false;
export async function ensureCvBucket() {
  if (ready) return;
  const { error } = await supabaseAdmin().storage.createBucket(CV_BUCKET, { public: false, fileSizeLimit: CV_MAX_BYTES, allowedMimeTypes: ["application/pdf"] });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
  ready = true;
}

export async function signedCvUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabaseAdmin().storage.from(CV_BUCKET).createSignedUrl(path, SIGNED_TTL_SEC);
  return error ? null : data.signedUrl;
}

/** Client-facing profile with a fresh signed CV link. Use only for the owner (or an admin). */
export async function profileResponse(u: { cvPath?: string | null }) {
  return mapPrismaUserToProfile({ ...u, cvUrl: await signedCvUrl(u.cvPath) });
}
