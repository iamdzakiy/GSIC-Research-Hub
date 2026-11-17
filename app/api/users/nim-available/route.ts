import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { nimError, storedNim } from "@/lib/nim";

export const dynamic = "force-dynamic";

/**
 * Is this NIM free? Answers only `{ available }`: no name, no email, nothing about who holds it.
 * Public (sign-up happens before an account exists) and rate limited per IP. The save routes check again.
 */
export const GET = withErrorHandler(async (request: Request) => {
  const rl = rateLimit(`nim-available:${clientIp(request)}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many checks. Try again in a minute." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });

  const url = new URL(request.url);
  const institution = url.searchParams.get("institution") ?? "ITB";
  const raw = url.searchParams.get("nim") ?? "";
  if (nimError(institution, raw)) return NextResponse.json({ ok: false, error: "Enter a valid NIM first." }, { status: 422 });

  const me = await getUserFromRequest(request).catch(() => null); // so you never see your own NIM as taken
  const nim = storedNim(institution, raw);
  const holder = await prisma.user.findUnique({ where: { nim }, select: { id: true } });
  return NextResponse.json({ available: !holder || holder.id === me?.id });
});
