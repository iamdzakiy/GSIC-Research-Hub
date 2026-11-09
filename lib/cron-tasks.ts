// Daily jobs (one Vercel cron run at 00:00 UTC = 07:00 WIB). Every e-mail has a dedupe key, so a re-run sends nothing twice.
import "server-only";
import { prisma } from "@/lib/prisma";
import { notify, escHtml as esc } from "@/lib/notify";
import { closesLabel, categoryShort } from "@/lib/competitions";
import { closeExpired } from "@/lib/team-calls";

const DAY = 86_400_000;
const isoDay = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10); // WIB date

/** Saved competitions closing in 7 days and in 1 day. */
export async function deadlineReminders(now = new Date()) {
  let n = 0;
  for (const [days, from, to] of [[7, 6 * DAY, 7 * DAY], [1, 0, DAY]] as const) {
    const saved = await prisma.savedOpportunity.findMany({
      where: { opportunity: { isPublished: true, status: { notIn: ["archived", "completed"] }, deadline: { gt: new Date(now.getTime() + from), lte: new Date(now.getTime() + to) } }, user: { deletedAt: null } },
      include: { opportunity: { select: { id: true, slug: true, title: true, deadline: true, type: true } } },
    });
    for (const s of saved) {
      const o = s.opportunity;
      const when = closesLabel(o.deadline, now).text;
      await notify(s.userId, {
        kind: "deadline",
        title: `${o.title} closes ${days === 1 ? "tomorrow" : "in 7 days"}`,
        body: when,
        path: o.type === "competition" ? `/competitions/${o.slug}` : `/opportunities/${o.slug}`,
        dedupeKey: `deadline${days}:${s.userId}:${o.id}`,
        email: {
          subject: `${days === 1 ? "Tomorrow" : "7 days left"}: ${o.title}`,
          preheader: when,
          title: days === 1 ? "Registration closes tomorrow" : "One week until registration closes",
          body: `You saved <strong>${esc(o.title)}</strong>. ${esc(when)}.`,
          cta: "Open the details",
        },
      });
      n++;
    }
  }
  return n;
}

/** Owners of open posts that close within 48 h and still have free slots. */
export async function expiringPosts(now = new Date()) {
  const calls = await prisma.teamCall.findMany({ where: { status: "open", hiddenAt: null, slots: { gt: 0 }, deadline: { gt: now, lte: new Date(now.getTime() + 2 * DAY) } }, select: { id: true, ownerId: true, title: true, slots: true } });
  for (const c of calls) {
    await notify(c.ownerId, {
      kind: "partner_expiring",
      title: `Still looking? "${c.title}" closes soon`,
      body: `${c.slots} slot${c.slots === 1 ? "" : "s"} left. Extend it or mark it filled.`,
      path: `/partners/${c.id}`,
      dedupeKey: `expiring:${c.id}`,
      email: {
        subject: `Still looking? "${c.title}" closes soon`,
        preheader: `${c.slots} slot${c.slots === 1 ? "" : "s"} left.`,
        title: "Your post closes in less than 48 hours",
        body: `"${esc(c.title)}" still has ${c.slots} free slot${c.slots === 1 ? "" : "s"}. Extend it if you are still looking, or mark it filled.`,
        cta: "Extend or mark filled",
      },
    });
  }
  return calls.length;
}

/** Monday digest: competitions that fit my interests and close within 14 days, plus new partner posts that fit me. Skipped when empty. */
export async function weeklyDigest(now = new Date()) {
  if (new Date(now.getTime() + 7 * 3600_000).getUTCDay() !== 1) return 0;
  const week = isoDay(now);
  const [comps, posts] = await Promise.all([
    prisma.opportunity.findMany({ where: { type: "competition", isPublished: true, status: { notIn: ["archived", "completed"] }, deadline: { gt: now, lte: new Date(now.getTime() + 14 * DAY) } }, select: { title: true, slug: true, category: true, deadline: true }, orderBy: { deadline: "asc" }, take: 60 }),
    prisma.teamCall.findMany({ where: { status: "open", hiddenAt: null, createdAt: { gte: new Date(now.getTime() - 7 * DAY) } }, select: { id: true, title: true, category: true, rolesNeeded: true, ownerId: true }, take: 100 }),
  ]);
  if (!comps.length && !posts.length) return 0;
  const users = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, name: true, competitionInterests: true } });
  let sent = 0;
  for (const u of users) {
    const fits = (c: string | null) => !u.competitionInterests.length || (!!c && u.competitionInterests.includes(c));
    const myComps = comps.filter((c) => fits(c.category)).slice(0, 5);
    const myPosts = posts.filter((p) => p.ownerId !== u.id && fits(p.category)).slice(0, 5);
    if (!myComps.length && !myPosts.length) continue;
    const lines = [
      ...myComps.map((c) => `${categoryShort(c.category) ? `[${categoryShort(c.category)}] ` : ""}${c.title}: ${closesLabel(c.deadline, now).text}`),
      ...myPosts.map((p) => `Seeking partner: ${p.title} (needs ${p.rolesNeeded.slice(0, 3).join(", ")})`),
    ];
    await notify(u.id, {
      kind: "digest",
      inApp: false,
      title: "Your week on GSIC Hub",
      body: lines.join("\n"),
      path: "/dashboard",
      dedupeKey: `digest:${week}:${u.id}`,
      email: {
        subject: `This week: ${myComps.length} competition${myComps.length === 1 ? "" : "s"} and ${myPosts.length} partner post${myPosts.length === 1 ? "" : "s"} for you`,
        preheader: lines[0] ?? "",
        title: "Your week on GSIC Hub",
        body: `Hi ${esc(u.name?.split(/\s+/)[0] || "there")}, here is what fits you this week.`,
        steps: lines,
        cta: "Open your dashboard",
      },
    });
    sent++;
  }
  return sent;
}

/** Users who asked to be told when an event opens. Called when an admin turns comingSoon off. */
export async function notifyEventOpened(eventId: string) {
  const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, slug: true, title: true } });
  if (!ev) return 0;
  const waiting = await prisma.eventInterest.findMany({ where: { eventId, notifiedAt: null } });
  for (const w of waiting) {
    await notify(w.userId, {
      kind: "event_open",
      title: `Registration is open: ${ev.title}`,
      body: "You asked us to tell you. Seats may be limited.",
      path: `/events/${ev.slug ?? ev.id}`,
      dedupeKey: `event-open:${ev.id}:${w.userId}`,
      email: {
        subject: `Pendaftaran dibuka: ${ev.title}`,
        preheader: "Anda meminta kami mengabari saat pendaftaran dibuka.",
        title: "Pendaftaran sudah dibuka",
        body: `Halo, pendaftaran <strong>${esc(ev.title)}</strong> sudah dibuka. Kursi bisa terbatas, jadi daftar lebih awal.`,
        cta: "Daftar sekarang",
      },
    });
  }
  await prisma.eventInterest.updateMany({ where: { eventId, notifiedAt: null }, data: { notifiedAt: new Date() } });
  return waiting.length;
}

export async function runDaily(now = new Date()) {
  await closeExpired();
  const reminders = await deadlineReminders(now);
  const expiring = await expiringPosts(now);
  const digest = await weeklyDigest(now);
  return { reminders, expiring, digest };
}
