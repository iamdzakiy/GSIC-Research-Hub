// ============================================================
// One way to tell a user something: an in-app Notification row, plus an e-mail through the
// outbox when their preference for that kind is on (default on). Never throws.
// ============================================================
import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { enqueue } from "@/lib/outbox";
import { renderEmail, type EmailCopy } from "@/lib/email-templates";
import { NOTIFY_KINDS, type NotifyKind, prefOn } from "@/lib/notify-kinds";

export const site = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

function secret() {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("UNSUBSCRIBE_SECRET is not set");
  return s;
}
export const unsubscribeToken = (userId: string, kind: string) => crypto.createHmac("sha256", secret()).update(`${userId}:${kind}`).digest("base64url").slice(0, 32);
export function verifyUnsubscribe(userId: string, kind: string, token: string) {
  const a = Buffer.from(unsubscribeToken(userId, kind)), b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export const unsubscribeUrl = (userId: string, kind: string) => `${site()}/api/unsubscribe?u=${encodeURIComponent(userId)}&k=${kind}&t=${unsubscribeToken(userId, kind)}`;

export interface NotifyInput {
  kind: NotifyKind;
  title: string;
  body: string; // plain text for the bell
  path: string; // e.g. /partners/abc
  email?: Omit<EmailCopy, "url" | "unsubscribeUrl">; // body is trusted HTML: escape user values
  dedupeKey?: string;
  inApp?: boolean; // default true
}

/** Notifies one user. The dedupe key (when given) makes the e-mail idempotent across cron runs. */
export async function notify(userId: string, n: NotifyInput): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, notifyPrefs: true, deletedAt: true } });
    if (!user || user.deletedAt) return;
    if (n.inApp !== false) await prisma.notification.create({ data: { userId, kind: n.kind, title: n.title.slice(0, 160), body: n.body.slice(0, 400), url: n.path } });
    if (!n.email || !prefOn(user.notifyPrefs, n.kind)) return;
    const unsub = unsubscribeUrl(userId, n.kind);
    const mail = renderEmail({ ...n.email, url: `${site()}${n.path}`, unsubscribeUrl: unsub, unsubscribeLabel: `Stop "${NOTIFY_KINDS[n.kind].label}" emails` }, site());
    await enqueue("email", {
      to: user.email,
      ...mail,
      headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }, { dedupeKey: n.dedupeKey });
  } catch (e) {
    console.error("[notify] failed:", (e as Error).message);
  }
}

/** Notifies every admin. */
export async function notifyAdmins(n: NotifyInput) {
  const admins = await prisma.user.findMany({ where: { role: "admin", deletedAt: null }, select: { id: true } });
  await Promise.all(admins.map((a) => notify(a.id, { ...n, dedupeKey: n.dedupeKey ? `${n.dedupeKey}:${a.id}` : undefined })));
}

/** E-mail that is not tied to a preference (welcome, event confirmation). Goes through the outbox. */
export async function sendViaOutbox(to: string, mail: { subject: string; html: string; text: string; attachments?: { filename: string; content: string; contentType: string }[] }, dedupeKey?: string) {
  try { await enqueue("email", { to, ...mail }, { dedupeKey }); } catch (e) { console.error("[outbox] enqueue failed:", (e as Error).message); }
}

export const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
