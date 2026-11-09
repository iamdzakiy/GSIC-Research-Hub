import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { reportSchema } from "@/lib/validation/teams";
import { notifyAdmins } from "@/lib/notify";

export const runtime = "nodejs";
const HIDE_AT = 3;

/** One report per person per post. Three distinct reports hide the post until an admin restores it. */
export const POST = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
  const me = await requireUser(request);
  const parsed = reportSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(422, "Keep the reason under 300 characters.");
  const call = await prisma.teamCall.findUnique({ where: { id: params.id }, select: { id: true, ownerId: true, title: true, hiddenAt: true } });
  if (!call) throw new HttpError(404, "Post not found");
  if (call.ownerId === me.id) throw new HttpError(403, "You cannot report your own post.");
  await prisma.postReport.upsert({
    where: { callId_reporterId: { callId: call.id, reporterId: me.id } },
    create: { callId: call.id, reporterId: me.id, reason: parsed.data.reason || null },
    update: { reason: parsed.data.reason || null },
  });
  const count = await prisma.postReport.count({ where: { callId: call.id } });
  if (count >= HIDE_AT && !call.hiddenAt) {
    await prisma.teamCall.update({ where: { id: call.id }, data: { hiddenAt: new Date() } });
    await notifyAdmins({ kind: "admin_submission", title: `Post hidden after ${count} reports`, body: `"${call.title}" was hidden. Review it and restore it if the reports were wrong.`, path: "/admin?tab=reports", dedupeKey: `hidden:${call.id}` });
  }
  return NextResponse.json({ ok: true });
});
