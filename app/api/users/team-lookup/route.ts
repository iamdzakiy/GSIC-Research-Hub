import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { nimError, storedNim } from "@/lib/nim";

export const runtime = "nodejs";

/**
 * Confirms a teammate's NIM while registering a team. Signed-in only and rate limited.
 * It returns a first name and a major, never the NIM back and never anything else.
 */
export const GET = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  const rl = await rateLimit(`team-lookup:${me.id}:${clientIp(request)}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many lookups. Wait a minute." }, { status: 429 });
  const raw = new URL(request.url).searchParams.get("nim") ?? "";
  if (nimError("ITB", raw)) return NextResponse.json({ ok: true, found: false });
  const u = await prisma.user.findFirst({ where: { nim: storedNim("ITB", raw), deletedAt: null, NOT: { id: me.id } }, select: { name: true, major: true } });
  return NextResponse.json({ ok: true, found: !!u, firstName: u?.name?.trim().split(/\s+/)[0] ?? null, major: u?.major ?? null });
});
