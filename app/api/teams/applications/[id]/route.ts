import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { decisionSchema } from "@/lib/validation/teams";
import { siteUrl } from "@/lib/supabaseAdmin";
import { notifyApplicantOfDecision } from "@/lib/team-calls";

export const runtime = "nodejs";

/**
 * Owner: accept or decline a pending application. Applicant: withdraw their own.
 * Accepting takes a slot atomically and marks the call `filled` when none are left.
 */
export const PATCH = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
  const me = await requireUser(request);
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Choose accepted, declined or withdrawn.");
  const next = parsed.data.status;

  const result = await prisma.$transaction(async (tx) => {
    const app = await tx.teamApplication.findUnique({ where: { id: params.id }, include: { call: true, applicant: { select: { email: true, name: true } } } });
    if (!app) throw new HttpError(404, "Application not found");
    const isOwner = app.call.ownerId === me.id;
    const isApplicant = app.applicantId === me.id;

    if (next === "withdrawn") {
      if (!isApplicant) throw new HttpError(403, "Only the applicant can withdraw.");
      if (app.status !== "pending") throw new HttpError(409, "Only pending applications can be withdrawn.");
    } else {
      if (!isOwner) throw new HttpError(403, "Only the call owner can decide.");
      if (app.status !== "pending") throw new HttpError(409, "This application was already decided.");
    }

    if (next === "accepted") {
      const taken = await tx.teamCall.updateMany({ where: { id: app.callId, status: "open", slots: { gt: 0 } }, data: { slots: { decrement: 1 } } });
      if (!taken.count) throw new HttpError(409, "No free slots left, or the call is closed.");
      const left = await tx.teamCall.findUniqueOrThrow({ where: { id: app.callId }, select: { slots: true } });
      if (left.slots === 0) await tx.teamCall.update({ where: { id: app.callId }, data: { status: "filled" } });
    }
    await tx.teamApplication.update({ where: { id: app.id }, data: { status: next } });
    return app;
  });

  if (next === "accepted" || next === "declined") {
    await notifyApplicantOfDecision({ to: result.applicant.email, applicantName: result.applicant.name, callTitle: result.call.title, accepted: next === "accepted", siteUrl: siteUrl(request) });
  }
  return NextResponse.json({ ok: true, status: next });
});
