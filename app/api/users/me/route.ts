import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { enqueue, kick } from "@/lib/outbox";
import { AVATAR_BUCKET, ownAvatarPath } from "@/lib/avatar";
import { CV_BUCKET } from "@/lib/cv";

export const runtime = "nodejs";

/**
 * Deletes the signed-in account. The Supabase login is removed and the profile row is anonymised
 * (kept so blog posts, results and registrations stay valid). Open posts and pending responses close,
 * and the user's cells in the matching sheet are blanked through the outbox.
 */
export const DELETE = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  const body = (await request.json().catch(() => null)) as { confirm?: string } | null;
  if (body?.confirm?.trim().toLowerCase() !== me.email.toLowerCase()) throw new HttpError(422, "Type your email exactly to confirm.", { confirm: "Type your email exactly to confirm" });
  if (me.role === "admin") throw new HttpError(403, "Admin accounts are removed by another admin.");

  const anonEmail = `deleted-${me.id}@deleted.invalid`;
  await prisma.$transaction(async (tx) => {
    await tx.teamCall.updateMany({ where: { ownerId: me.id, status: "open" }, data: { status: "closed" } });
    await tx.teamApplication.updateMany({ where: { applicantId: me.id, status: "pending" }, data: { status: "withdrawn" } });
    await tx.notification.deleteMany({ where: { userId: me.id } });
    await tx.savedOpportunity.deleteMany({ where: { userId: me.id } });
    await tx.eventInterest.deleteMany({ where: { userId: me.id } });
    await tx.user.update({
      where: { id: me.id },
      data: {
        email: anonEmail, name: "Deleted user", username: null, whatsapp: null, avatarUrl: null, linkedinUrl: null, cvPath: null, bio: null,
        headline: null, portfolioUrl: null, githubUrl: null, achievements: [], skills: [], softSkills: [], interests: [], fields: [],
        competitionInterests: [], directoryVisible: false, openToTeam: false, notifyPrefs: {}, deletedAt: new Date(),
      },
    });
    await enqueue("sheet_clear", { email: me.email }, { tx });
  });
  kick();

  const admin = supabaseAdmin();
  const avatar = ownAvatarPath(me.avatarUrl);
  await Promise.all([
    avatar ? admin.storage.from(AVATAR_BUCKET).remove([avatar]).catch(() => undefined) : null,
    me.cvPath ? admin.storage.from(CV_BUCKET).remove([me.cvPath]).catch(() => undefined) : null,
  ]);
  const { error } = await admin.auth.admin.deleteUser(me.id);
  if (error) console.error("[account] supabase delete failed (profile already anonymised):", error.message);
  return NextResponse.json({ ok: true });
});
