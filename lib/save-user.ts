// The one way server code changes profile data: update the row, then mirror it to the matching sheet (via the outbox).
import "server-only";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api-utils";
import { syncProfileToSheet } from "@/lib/matchmaking-sheet";
import { RESERVED } from "@/lib/username";
import type { Prisma } from "../generated/prisma/client";

export async function saveUser(id: string, data: Prisma.UserUpdateInput | Record<string, unknown>) {
  const username = (data as { username?: unknown }).username;
  if (typeof username === "string") {
    if (RESERVED.has(username)) throw new HttpError(422, "That username is reserved.", { username: "That username is reserved" });
    const taken = await prisma.user.findFirst({ where: { username, NOT: { id } }, select: { id: true } });
    if (taken) throw new HttpError(409, "That username is taken.", { username: "That username is taken" });
  }
  const updated = await prisma.user.update({ where: { id }, data: data as Prisma.UserUpdateInput });
  await syncProfileToSheet(id);
  return updated;
}
