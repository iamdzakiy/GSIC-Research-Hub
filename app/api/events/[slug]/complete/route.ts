import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";

export const runtime = "nodejs";
const body = z.object({ recap: z.string().trim().max(1200, "Keep the recap under 1,200 characters").optional(), undo: z.boolean().optional() });

/** Admin: mark an event as completed (shows "Selesai" and a recap instead of the form) or take that back. Dates and the coming-soon flag are never touched. */
export const POST = withErrorHandler(async (request: Request, { params }: { params: { slug: string } }) => {
  await requireAdmin(request);
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Bad request");
  const event = await prisma.event.findFirst({ where: { OR: [{ slug: params.slug }, { id: params.slug }] } });
  if (!event) throw new HttpError(404, "Event not found.");
  const data = parsed.data.undo ? { status: "upcoming" as const } : { status: "completed" as const, registrationOpen: false, recap: parsed.data.recap || null };
  const updated = await prisma.event.update({ where: { id: event.id }, data });
  return NextResponse.json({ ok: true, status: updated.status });
});
