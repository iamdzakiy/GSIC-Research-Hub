import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";

export const runtime = "nodejs";

/** Admin: turn certificates on or off for one event. Off by default. */
export const POST = withErrorHandler(async (request: Request, { params }: { params: { slug: string } }) => {
  await requireAdmin(request);
  const parsed = z.object({ enabled: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Bad request.");
  const ev = await prisma.event.findFirst({ where: { OR: [{ slug: params.slug }, { id: params.slug }] }, select: { id: true } });
  if (!ev) throw new HttpError(404, "Event not found.");
  await prisma.event.update({ where: { id: ev.id }, data: { certificateEnabled: parsed.data.enabled } });
  return NextResponse.json({ ok: true, enabled: parsed.data.enabled });
});
