import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler, zodFieldErrors } from "@/lib/api-utils";
import { applySchema } from "@/lib/validation/teams";
import { closeExpired, notifyOwnerOfApplication } from "@/lib/team-calls";

export const runtime = "nodejs";

export const POST = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
  const me = await requireUser(request);
  if (!me.linkedinUrl) throw new HttpError(403, "Add your LinkedIn profile before applying.");
  const parsed = applySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(parsed.error));
  const { role, message } = parsed.data;
  const today = await prisma.teamApplication.count({ where: { applicantId: me.id, createdAt: { gt: new Date(Date.now() - 86_400_000) } } });
  if (today >= 10) throw new HttpError(429, "You have sent 10 responses today. Try again tomorrow.");

  await closeExpired();
  const app = await prisma.$transaction(async (tx) => {
    const call = await tx.teamCall.findUnique({ where: { id: params.id }, include: { owner: { select: { id: true, name: true } } } });
    if (!call) throw new HttpError(404, "Call not found");
    if (call.ownerId === me.id) throw new HttpError(403, "You cannot apply to your own call.");
    if (call.hiddenAt) throw new HttpError(404, "Call not found");
    if (call.status !== "open" || call.slots < 1) throw new HttpError(409, "This call is no longer open.");
    if (call.kind === "team_needs_member" && !call.rolesNeeded.some((r) => r.toLowerCase() === role.toLowerCase())) throw new HttpError(422, "That role is not needed in this call.", { role: "Pick one of the roles this team needs" });
    const prev = await tx.teamApplication.findUnique({ where: { callId_applicantId: { callId: call.id, applicantId: me.id } } });
    if (prev && prev.status !== "withdrawn") throw new HttpError(409, "You already applied to this call.");
    const saved = prev
      ? await tx.teamApplication.update({ where: { id: prev.id }, data: { role, message, status: "pending" } })
      : await tx.teamApplication.create({ data: { callId: call.id, applicantId: me.id, role, message } });
    return { saved, call };
  });

  await notifyOwnerOfApplication({ ownerId: app.call.owner.id, ownerName: app.call.owner.name, applicant: me.name ?? "A member", callId: app.call.id, callTitle: app.call.title, role, lookingForTeam: app.call.kind === "looking_for_team" });
  return NextResponse.json({ ok: true, id: app.saved.id }, { status: 201 });
});
