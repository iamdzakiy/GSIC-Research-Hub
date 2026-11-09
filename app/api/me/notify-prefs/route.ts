import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { NOTIFY_KINDS, prefOn } from "@/lib/notify-kinds";

const schema = z.record(z.string(), z.boolean()).refine((o) => Object.keys(o).every((k) => k in NOTIFY_KINDS), "Unknown notification kind");

export const GET = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  const prefs = Object.fromEntries(Object.keys(NOTIFY_KINDS).map((k) => [k, prefOn(me.notifyPrefs, k)]));
  return NextResponse.json({ ok: true, prefs, isAdmin: me.role === "admin" });
});

export const PUT = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Invalid preferences.");
  const prefs = { ...((me.notifyPrefs as Record<string, boolean> | null) ?? {}), ...parsed.data };
  await prisma.user.update({ where: { id: me.id }, data: { notifyPrefs: prefs } });
  return NextResponse.json({ ok: true, prefs });
});
