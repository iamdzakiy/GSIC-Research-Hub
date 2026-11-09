import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { AVATAR_BUCKET, AVATAR_MAX_BYTES, ensureAvatarBucket, ownAvatarPath, sniffImage } from "@/lib/avatar";
import { profileResponse } from "@/lib/cv";
import { saveUser } from "@/lib/save-user";

export const runtime = "nodejs";
const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

/** Upload a profile photo (webp/jpeg/png, 2 MB max). Replaces and deletes the previous upload. */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const file = (await request.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return fail(400, "Attach an image in the \"file\" field.");
  if (file.size > AVATAR_MAX_BYTES) return fail(413, "Use an image of 2 MB or less.");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(buf);
  if (!type) return fail(415, "Use a JPG, PNG or WebP image.");

  await ensureAvatarBucket();
  const ext = type.split("/")[1];
  const path = `${user.id}/${Date.now()}.${ext}`;
  const store = supabaseAdmin().storage.from(AVATAR_BUCKET);
  const { error } = await store.upload(path, buf, { contentType: type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const old = ownAvatarPath(user.avatarUrl);
  const url = store.getPublicUrl(path).data.publicUrl;
  const saved = await saveUser(user.id, { avatarUrl: url });
  if (old) await store.remove([old]).catch(() => undefined);
  return NextResponse.json({ ok: true, profile: await profileResponse(saved) });
});
