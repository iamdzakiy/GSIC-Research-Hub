// Server side of event registration: team members by NIM, one team per NIM per event, and the waitlist.
import "server-only";
import type { Prisma } from "../generated/prisma/client";
import { HttpError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { storedNim } from "@/lib/nim";
import type { TeamMember } from "@/lib/validation/events";

type Tx = Prisma.TransactionClient;

export interface StoredMember { nim: string; name: string; email: string | null; userId: string | null }

const firstName = (n: string | null) => n?.trim().split(/\s+/)[0] ?? "";

/**
 * Turns the NIMs a person typed into stored members. A NIM that belongs to a Hub user is filled from the profile.
 * Any other NIM needs a name and an email from the form.
 */
export async function resolveTeam(owner: { id: string; nim: string | null }, members: TeamMember[], db: Tx | typeof prisma = prisma): Promise<StoredMember[]> {
  const nims = members.map((m) => m.nim);
  if (owner.nim && nims.includes(storedNim("ITB", owner.nim))) throw new HttpError(422, "Do not list yourself.", { teamMembers: "Do not list your own NIM" });
  const users = nims.length ? await db.user.findMany({ where: { nim: { in: nims }, deletedAt: null }, select: { id: true, name: true, email: true, nim: true } }) : [];
  const byNim = new Map(users.map((u) => [u.nim as string, u]));
  return members.map((m, i) => {
    const u = byNim.get(m.nim);
    if (u) return { nim: m.nim, name: u.name ?? "", email: null, userId: u.id };
    if (!m.name || !m.email) throw new HttpError(422, "Check your teammates.", { teamMembers: `Teammate ${i + 1} (${m.nim}) is not on the Hub yet. Add their name and ITB email.` });
    return { nim: m.nim, name: m.name, email: m.email.toLowerCase(), userId: null };
  });
}

/** Every NIM already claimed in this event by a registrant or listed as a teammate. `ignoreUserId` skips the person's own earlier registration (editing). */
export async function claimedNims(tx: Tx, eventId: string, ignoreUserId?: string): Promise<Map<string, string>> {
  const rows = await tx.registration.findMany({ where: { eventId, status: { not: "cancelled" }, ...(ignoreUserId ? { userId: { not: ignoreUserId } } : {}) }, include: { user: { select: { nim: true, name: true } } } });
  const out = new Map<string, string>();
  for (const r of rows) {
    if (r.user.nim) out.set(r.user.nim, r.user.name ?? "another registrant");
    const d = r.details as { teamMembers?: { nim?: string }[] } | null;
    for (const m of d?.teamMembers ?? []) if (m && typeof m.nim === "string") out.set(m.nim, r.user.name ?? "another team");
  }
  return out;
}

export async function assertTeamFree(tx: Tx, eventId: string, owner: { id: string; nim: string | null }, members: StoredMember[]) {
  const claimed = await claimedNims(tx, eventId, owner.id);
  const clash = members.find((m) => claimed.has(m.nim));
  if (clash) throw new HttpError(409, "A teammate is already in another team for this event.", { teamMembers: `${clash.nim} is already in another team for this event.` });
  if (owner.nim && claimed.has(owner.nim)) throw new HttpError(409, "You are already listed in another team for this event.");
}

/** Confirms the first person on the waitlist, if a place is free. Returns who was promoted so the caller can notify after the commit. */
export async function promoteNext(tx: Tx, eventId: string): Promise<{ userId: string; regId: string } | null> {
  const ev = await tx.event.findUnique({ where: { id: eventId }, select: { maxParticipants: true, currentParticipants: true } });
  if (!ev?.maxParticipants || ev.currentParticipants >= ev.maxParticipants) return null;
  const next = await tx.registration.findFirst({ where: { eventId, status: "waitlisted" }, orderBy: { registeredAt: "asc" } });
  if (!next) return null;
  const seat = await tx.event.updateMany({ where: { id: eventId, currentParticipants: { lt: ev.maxParticipants } }, data: { currentParticipants: { increment: 1 } } });
  if (!seat.count) return null;
  await tx.registration.update({ where: { id: next.id }, data: { status: "confirmed" } });
  return { userId: next.userId, regId: next.id };
}

export async function notifyPromoted(p: { userId: string }, event: { title: string; slug: string | null }) {
  const path = `/events/${event.slug ?? ""}`;
  const u = await prisma.user.findUnique({ where: { id: p.userId }, select: { name: true } });
  await notify(p.userId, {
    kind: "waitlist",
    title: `Kamu mendapat tempat di ${event.title}`,
    body: "Seseorang mundur dan tempatmu sudah dikonfirmasi. Buka halaman acara untuk detailnya.",
    path,
    email: { subject: `Tempatmu di ${event.title} sudah dikonfirmasi`, preheader: "Kamu naik dari daftar tunggu.", title: "Kamu mendapat tempat", body: `Halo${firstName(u?.name ?? null) ? ` ${firstName(u?.name ?? null)}` : ""}, ada tempat kosong di ${event.title} dan kamu yang pertama di daftar tunggu. Pendaftaranmu sekarang terkonfirmasi.`, cta: "Buka halaman acara" },
    dedupeKey: `waitlist-promoted:${p.userId}:${event.slug}`,
  });
}
