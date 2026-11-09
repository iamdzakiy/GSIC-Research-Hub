import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribe } from "@/lib/notify";
import { NOTIFY_KINDS, isNotifyKind } from "@/lib/notify-kinds";

export const runtime = "nodejs";

async function apply(url: URL): Promise<{ ok: boolean; label?: string }> {
  const u = url.searchParams.get("u") ?? "", k = url.searchParams.get("k") ?? "", t = url.searchParams.get("t") ?? "";
  if (!u || !isNotifyKind(k) || !t || !verifyUnsubscribe(u, k, t)) return { ok: false };
  const user = await prisma.user.findUnique({ where: { id: u }, select: { notifyPrefs: true } });
  if (!user) return { ok: false };
  await prisma.user.update({ where: { id: u }, data: { notifyPrefs: { ...((user.notifyPrefs as Record<string, boolean> | null) ?? {}), [k]: false } } });
  return { ok: true, label: NOTIFY_KINDS[k].label };
}

/** Footer link: turns off one category without signing in, then shows a confirmation page. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const r = await apply(url);
  return NextResponse.redirect(new URL(r.ok ? `/unsubscribed?k=${url.searchParams.get("k")}` : "/unsubscribed?error=1", url.origin));
}

/** RFC 8058 one-click (List-Unsubscribe-Post). */
export async function POST(req: Request) {
  const r = await apply(new URL(req.url));
  return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 400 });
}
