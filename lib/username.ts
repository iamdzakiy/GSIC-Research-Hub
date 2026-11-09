// Username (handle) helpers: a-z0-9_, 3–20 chars, unique. Used for /u/[username].
import "server-only";
import { prisma } from "@/lib/prisma";

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const RESERVED = new Set(["admin", "gsic", "settings", "me", "api", "auth", "u", "new", "edit"]);

export function slugUsername(name: string): string {
  const base = name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 16);
  return base.length >= 3 ? base : `${base}user`.slice(0, 16);
}

/** First free handle based on `name`: dzakiy_muhammad, dzakiy_muhammad2, ... */
export async function uniqueUsername(name: string, excludeUserId?: string): Promise<string> {
  const base = slugUsername(name || "member");
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base.slice(0, 20 - String(i + 1).length)}${i + 1}`;
    if (RESERVED.has(candidate)) continue;
    const taken = await prisma.user.findFirst({ where: { username: candidate, ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}) }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base.slice(0, 12)}_${Math.random().toString(36).slice(2, 7)}`;
}
