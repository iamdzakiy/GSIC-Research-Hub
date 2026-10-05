/**
 * One-off, idempotent: rewrites stored Indonesian category values to the English ones the app now uses.
 *   npx tsx scripts/migrate-english.ts
 * Touches ResourceLink.category and Opportunity.benefitCategories only. Safe to run more than once.
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const LINKS: Record<string, string> = {
  "Beasiswa": "Scholarships", "Kompetisi": "Competitions", "Riset & Jurnal": "Research & Journals", "Karier & Magang": "Careers & Internships",
  "Tools & Template": "Tools & Templates", "Kampus ITB": "ITB Campus", "Belajar & Kursus": "Learning & Courses", "Komunitas": "Communities", "Lainnya": "Other",
};
const BENEFITS: Record<string, string> = {
  "Biaya Pendidikan": "Tuition", "Biaya Hidup": "Living costs", "Dana Riset": "Research funding", "Hadiah Uang": "Cash prize",
  "Pengembangan Diri": "Personal development", "Magang": "Internship", "Sertifikat": "Certificate",
};

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  let links = 0, opps = 0;
  for (const [from, to] of Object.entries(LINKS)) {
    links += (await prisma.resourceLink.updateMany({ where: { category: from }, data: { category: to } })).count;
  }
  const rows = await prisma.opportunity.findMany({ where: { benefitCategories: { hasSome: Object.keys(BENEFITS) } }, select: { id: true, benefitCategories: true } });
  for (const r of rows) {
    const next = Array.from(new Set(r.benefitCategories.map((b) => BENEFITS[b] ?? b)));
    await prisma.opportunity.update({ where: { id: r.id }, data: { benefitCategories: next } });
    opps++;
  }
  console.log(`link categories updated: ${links}, opportunities updated: ${opps}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
