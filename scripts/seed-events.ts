/**
 * Seeds the real GSIC programs. Idempotent: events are keyed by slug and an existing event is left alone
 * (so admin edits survive), unless you pass --force to overwrite its content. Registration counts are never touched.
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

const mod = (order: number, title: string, description: string, dateLabel: string, durationHours = 0) => ({ id: `m${order}`, title, description, order, dateLabel, durationHours });

const EVENTS: Seed[] = [
  {
    slug: "sandbox-sesi-1",
    type: "sandbox",
    title: "GSIC Research Sandbox: Co-Disciplinary Design Sprint, Sesi 1",
    shortDescription: "Makanan Masa Depan 2050: sesi daring lintas jurusan bersama empat HMPS ITB.",
    description:
      "Sesi 1 mengangkat tema \"Makanan Masa Depan 2050\".\n\n" +
      "Pertanyaan pemantik: Jika daging, protein, dan makanan pokok bisa dibuat dari sel, serangga, dan fermentasi, apa yang akan kita makan pada 2050, dan siapa yang diuntungkan?\n\n" +
      "Empat HMPS ITB (Nymphaea ITB, Vadra ITB, HMPG ITB, HMP PL ITB) masing-masing memaparkan sudut pandang jurusannya selama 15 menit. Setelah itu ada tanya jawab, diskusi di empat kelompok breakout, dan presentasi kelompok.",
    startDate: new Date("2026-11-12T12:00:00Z"), // Kamis 12 November 2026, 19.00 WIB (open gate)
    endDate: new Date("2026-11-12T15:05:00Z"), // 22.05 WIB
    registrationDeadline: new Date("2026-11-12T10:00:00Z"), // 17.00 WIB
    location: "Zoom (daring penuh)",
    mode: "online",
    maxParticipants: 60,
    status: "upcoming",
    clusters: [],
    hasPreTest: false,
    hasPostTest: false,
    preTestExplanation: "",
    postTestExplanation: "",
    speakers: ["Nymphaea ITB", "Vadra ITB", "HMPG ITB", "HMP PL ITB"].map((name, i) => ({ id: `s${i + 1}`, name, roleTitle: "Panelis, HMPS", institution: "ITB", order: i + 1 })),
    modules: [
      mod(1, "Open gate", "Peserta masuk ruang Zoom.", "19.00 WIB"),
      mod(2, "Pembukaan", "Pengantar tema dan pertanyaan pemantik.", "19.30 WIB"),
      mod(3, "Panel empat HMPS", "Masing-masing HMPS memaparkan sudut pandangnya, 15 menit per panelis.", "4 x 15 menit"),
      mod(4, "Tanya jawab", "Tanya jawab dengan panelis.", ""),
      mod(5, "Diskusi breakout", "Empat kelompok lintas jurusan mengerjakan pertanyaan pemantik.", ""),
      mod(6, "Presentasi kelompok", "Setiap kelompok menyampaikan hasil diskusinya.", ""),
      mod(7, "Selesai", "", "22.05 WIB"),
    ],
  },
  {
    slug: "sandbox-sesi-2",
    type: "sandbox",
    title: "GSIC Research Sandbox: Sesi 2, Pulau Energi Terbarukan",
    shortDescription: "Bagaimana pulau berpenghuni 10.000 jiwa bisa memenuhi kebutuhan energinya dari sumber terbarukan?",
    description:
      "Sesi 2 mengangkat tema \"Pulau Energi Terbarukan\".\n\n" +
      "Pertanyaan pemantik: Bagaimana sebuah pulau berpenghuni 10.000 jiwa dapat memenuhi seluruh kebutuhan energinya dari sumber terbarukan dan tetap terjangkau?\n\n" +
      "Peserta mengerjakan empat tantangan: sumber energi, penyimpanan, warga dan perilaku, serta uang dan kepemilikan. Tanggal dan lokasi menyusul.",
    startDate: new Date("2026-12-01T00:00:00Z"), // placeholder; dateLabel is what people see
    endDate: new Date("2026-12-07T00:00:00Z"),
    registrationDeadline: new Date("2026-12-01T00:00:00Z"),
    dateLabel: "Awal Desember 2026, tanggal menyusul",
    location: "Menyusul",
    mode: "onsite",
    registrationOpen: false,
    maxParticipants: 60,
    status: "upcoming",
    clusters: [],
    hasPreTest: false,
    hasPostTest: false,
    preTestExplanation: "",
    postTestExplanation: "",
    speakers: [],
    modules: [
      mod(1, "Sumber energi", "Energi terbarukan apa yang paling cocok untuk pulau ini?", ""),
      mod(2, "Penyimpanan", "Bagaimana energi disimpan agar pasokan stabil?", ""),
      mod(3, "Warga dan perilaku", "Bagaimana kebiasaan warga memengaruhi kebutuhan dan penerimaan?", ""),
      mod(4, "Uang dan kepemilikan", "Siapa yang membiayai dan memiliki sistemnya, dan apakah tetap terjangkau?", ""),
    ],
  },
  {
    slug: "pkm-bootcamp-2027",
    type: "bootcamp",
    title: "PKM Bootcamp: ITB Ace PKM 2027",
    shortDescription: "Gratis. Empat episode, 12,5 jam, sekitar 75% workshop, untuk skema PKM-RE, PKM-KC, PKM-GFT, dan PKM-K.",
    description:
      "Program pendampingan PKM 2027 untuk mahasiswa ITB. Gratis.\n\n" +
      "Skema: PKM-RE, PKM-KC, PKM-GFT, PKM-K. Empat episode dengan total 12,5 jam, sekitar 75% berupa workshop. Setiap episode memiliki pra-tes dan pasca-tes, dan setiap peserta mendapat rapor peserta.\n\n" +
      "Pendaftaran dan pengumpulan tugas dilakukan daring. Sesi tatap muka berlangsung di Kampus ITB Ganesha. Tanggal pasti setiap episode menyusul.",
    startDate: new Date("2026-11-01T00:00:00Z"), // placeholder; dateLabel is what people see
    endDate: new Date("2027-04-30T00:00:00Z"),
    registrationDeadline: new Date("2026-11-30T16:59:00Z"),
    dateLabel: "Pendaftaran Okt–Nov 2026, program Nov 2026 – Apr 2027",
    location: "Kampus ITB Ganesha (pendaftaran dan tugas daring)",
    mode: "onsite",
    maxParticipants: 100,
    status: "upcoming",
    clusters: [],
    hasPreTest: true,
    hasPostTest: true,
    preTestExplanation: "Setiap episode dibuka dengan pra-tes singkat untuk melihat titik awal Anda.",
    postTestExplanation: "Setiap episode ditutup dengan pasca-tes. Selisihnya muncul di rapor peserta.",
    speakers: [],
    modules: [
      mod(1, "Dari Keresahan ke Masalah Riset", "Episode 1", "Nov 2026", 3),
      mod(2, "Merancang Riset yang Bisa Dikerjakan", "Episode 2", "Des 2026", 3),
      mod(3, "Menulis Proposal yang Lolos Format", "Episode 3", "Jan 2027", 3.5),
      mod(4, "Siap Submit, Siap Tampil", "Episode 4", "Mar 2027", 3),
      mod(5, "Pitching Day", "Presentasi akhir", "Apr 2027", 0),
    ],
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
