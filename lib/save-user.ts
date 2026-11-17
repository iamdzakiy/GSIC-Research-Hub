// The one way server code changes profile data: update the row, then mirror it to the matching sheet (via the outbox).
import "server-only";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api-utils";
import { syncProfileToSheet } from "@/lib/matchmaking-sheet";
import { RESERVED } from "@/lib/username";
import { NIM_TAKEN } from "@/lib/nim";
import type { Prisma } from "../generated/prisma/client";

export async function saveUser(id: string, data: Prisma.UserUpdateInput | Record<string, unknown>) {
  const username = (data as { username?: unknown }).username;
  if (typeof username === "string") {
    if (RESERVED.has(username)) throw new HttpError(422, "That username is reserved.", { username: "That username is reserved" });
    const taken = await prisma.user.findFirst({ where: { username, NOT: { id } }, select: { id: true } });
    if (taken) throw new HttpError(409, "That username is taken.", { username: "That username is taken" });
  }
  const nim = (data as { nim?: unknown }).nim;
  let previousNim: string | null | undefined;
  if (typeof nim === "string") {
    const taken = await prisma.user.findFirst({ where: { nim, NOT: { id } }, select: { id: true } });
    if (taken) throw new HttpError(409, NIM_TAKEN, { nim: NIM_TAKEN });
    previousNim = (await prisma.user.findUnique({ where: { id }, select: { nim: true } }))?.nim;
  }
  const updated = await prisma.user.update({ where: { id }, data: data as Prisma.UserUpdateInput }).catch((e: { code?: string; meta?: { target?: string[] } }) => {
    if (e?.code === "P2002" && e.meta?.target?.includes("nim")) throw new HttpError(409, NIM_TAKEN, { nim: NIM_TAKEN });
    throw e;
  });
  // Students get a new NIM when they move from first year into a major. Admins can see each change.
  if (typeof nim === "string" && previousNim && previousNim !== nim) await prisma.nimChange.create({ data: { userId: id, from: previousNim, to: nim } });
  await syncProfileToSheet(id);
  return updated;
}
