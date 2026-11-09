/**
 * Seeds the GSIC programs as "coming soon". Idempotent: events are keyed by slug and an existing event is left alone
 * (so admin edits survive), unless you pass --force to overwrite it (needed once, to clear the old unconfirmed details).
 * Registration counts are never touched.
 *   npx tsx scripts/seed-events.ts [--force]
 * Also removes the old made-up events (event-pkm-bootcamp / event-sandbox) when nobody registered for them.
 * Copy is Indonesian on purpose: that is the community's language.
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const force = process.argv.includes("--force");

type Seed = Omit<Parameters<typeof prisma.event.create>[0]["data"], "createdBy" | "currentParticipants">;


// Every program is "coming soon" until GSIC confirms dates, speakers and capacity. Nothing unconfirmed is stored:
// dates, panelists, capacity, Zoom links and agendas are cleared (an admin fills them in when the program opens).
const SOON = {
  comingSoon: true, registrationOpen: false, status: "upcoming", mode: "onsite",
  startDate: null, endDate: null, registrationDeadline: null, location: null, maxParticipants: null,
  dateLabel: null, meetingUrl: null, clusters: [], modules: [], speakers: [],
  hasPreTest: false, hasPostTest: false, preTestExplanation: "", postTestExplanation: "",
} as const;

const EVENTS: Seed[] = [
  {
    ...SOON,
    slug: "pkm-bootcamp-2027",
    type: "bootcamp",
    series: "GSIC PKM Bootcamp",
    title: "GSIC PKM Bootcamp 2027",
    shortDescription: "Pendampingan menulis proposal PKM dari ide sampai siap submit. Gratis untuk mahasiswa ITB.",
    description: "Program pendampingan PKM untuk mahasiswa ITB: menemukan masalah riset, merancang metode, menulis proposal sesuai format, dan bersiap tampil. Jadwal, skema, dan kuota akan diumumkan di sini.",
  },
  {
    ...SOON,
    slug: "sandbox-sesi-1",
    type: "sandbox",
    series: "The Sandbox Series",
    title: "The Sandbox Series: Sesi 1",
    shortDescription: "Design sprint lintas disiplin: satu pertanyaan besar, dibedah bersama mahasiswa dari berbagai jurusan.",
    description: "Sesi diskusi dan design sprint lintas jurusan. Setiap sesi membawa satu pertanyaan pemantik yang dikerjakan bersama dalam kelompok. Tema, panelis, dan jadwal akan diumumkan di sini.",
  },
  {
    ...SOON,
    slug: "sandbox-sesi-2",
    type: "sandbox",
    series: "The Sandbox Series",
    title: "The Sandbox Series: Sesi 2",
    shortDescription: "Sesi berikutnya dari The Sandbox Series. Detail menyusul.",
    description: "Sesi lanjutan The Sandbox Series dengan pertanyaan pemantik baru. Tema, panelis, dan jadwal akan diumumkan di sini.",
  },
];

async function main() {
  for (const e of EVENTS) {
    const exists = await prisma.event.findUnique({ where: { slug: e.slug! }, select: { id: true } });
    if (exists && !force) { console.log(`skip    ${e.slug} (exists; use --force to overwrite)`); continue; }
    const data = e as never;
    if (exists) await prisma.event.update({ where: { id: exists.id }, data });
    else await prisma.event.create({ data: { ...(e as object), currentParticipants: 0, createdBy: "seed-events" } as never });
    console.log(`${exists ? "update " : "create "} ${e.slug}`);
  }
  for (const id of ["event-pkm-bootcamp", "event-sandbox"]) {
    const old = await prisma.event.findUnique({ where: { id }, include: { _count: { select: { registrations: true } } } });
    if (!old) continue;
    if (old._count.registrations > 0) { console.log(`keep    ${id} (${old._count.registrations} registrations; remove it in Admin when ready)`); continue; }
    await prisma.event.delete({ where: { id } });
    console.log(`delete  ${id} (old made-up event)`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
