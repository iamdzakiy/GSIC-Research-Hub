import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler, zodFieldErrors } from "@/lib/api-utils";
import { bootcampAnswers, sandboxAnswers } from "@/lib/validation/events";
import { assertTeamFree, notifyPromoted, promoteNext, resolveTeam, type StoredMember } from "@/lib/registration";

export const runtime = "nodejs";
type Ctx = { params: { id: string } };

async function mine(request: Request, id: string) {
  const user = await requireUser(request);
  const reg = await prisma.registration.findUnique({ where: { id }, include: { event: true } });
  if (!reg || reg.userId !== user.id || reg.status === "cancelled") throw new HttpError(404, "Registration not found.");
  const { event } = reg;
  if (event.status === "completed" || event.status === "archived") throw new HttpError(409, "This event has ended.");
  if (!event.registrationDeadline || new Date() > event.registrationDeadline) throw new HttpError(409, "The registration deadline has passed, so it can no longer be changed.");
  return { user, reg, event };
}

/** Edit your answers until the deadline. Status and place in the queue stay as they are. */
export const PUT = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const { user, reg, event } = await mine(request, params.id);
  const body = (await request.json().catch(() => null)) as { answers?: unknown } | null;
  let details: Record<string, unknown>;
  if (event.type === "bootcamp") {
    const r = bootcampAnswers.safeParse(body?.answers ?? {});
    if (!r.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(r.error));
    details = { ...r.data, teamMembers: await resolveTeam(user, r.data.needsTeam ? [] : r.data.teamMembers) };
  } else {
    const r = sandboxAnswers.safeParse(body?.answers ?? {});
    if (!r.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(r.error));
    details = r.data;
  }
  await prisma.$transaction(async (tx) => {
    if (event.type === "bootcamp") await assertTeamFree(tx, event.id, user, (details.teamMembers as StoredMember[]) ?? []);
    await tx.registration.update({ where: { id: reg.id }, data: { details: details as never, motivation: typeof details.hope === "string" ? details.hope : null } });
  });
  return NextResponse.json({ ok: true });
});

/** Cancel until the deadline. A freed place goes to the first person on the waitlist. */
export const DELETE = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const { reg, event } = await mine(request, params.id);
  const promoted = await prisma.$transaction(async (tx) => {
    await tx.registration.update({ where: { id: reg.id }, data: { status: "cancelled" } });
    if (reg.status !== "confirmed") return null;
    await tx.event.updateMany({ where: { id: event.id, currentParticipants: { gt: 0 } }, data: { currentParticipants: { decrement: 1 } } });
    return promoteNext(tx, event.id);
  });
  if (promoted) await notifyPromoted(promoted, event);
  return NextResponse.json({ ok: true });
});
