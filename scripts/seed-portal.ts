/**
 * Seeds the portal's link collection (and optionally sample opportunities).
 *   npx tsx scripts/seed-portal.ts              -> links only (idempotent upsert by URL)
 *   SEED_SAMPLES=1 npx tsx scripts/seed-portal.ts -> + 4 clearly-labelled "[CONTOH]" opportunities
 * Links are official homepages only. Verify them before launch; edit in Admin > Links.
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SEED_LINKS as LINKS } from "./content/links";
import { SEED_POSTS } from "./content/blog-posts";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  let i = 0;
  for (const [category, title, url, description, tags, featured] of LINKS) {
    await prisma.resourceLink.upsert({
      where: { url },
      update: {},
      create: { category, title, url, description, tags, isFeatured: !!featured, order: i++ },
    });
  }
  console.log(`links: ${LINKS.length} ensured`);

  // Starter blog posts: published under the first admin (idempotent by slug). Skip with SEED_POSTS=0.
  if (process.env.SEED_POSTS !== "0") {
    const author = await prisma.user.findFirst({ where: { role: "admin" }, orderBy: { createdAt: "asc" } });
    if (!author) console.log("blog: no admin user found, skipping posts (create an admin first)");
    else {
      for (const p of SEED_POSTS) {
        await prisma.blogPost.upsert({
          where: { slug: p.slug }, update: {},
          create: { slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content, tags: p.tags, status: "published", publishedAt: new Date(), authorId: author.id },
        });
      }
      console.log(`blog: ${SEED_POSTS.length} starter posts ensured`);
    }
  }

  if (process.env.SEED_SAMPLES === "1") {
    const d = (days: number) => new Date(Date.now() + days * 86400000);
    const base = { requiredSkills: [] as string[], isAnnual: false, status: "active" as const };
    const samples = [
      { type: "scholarship" as const, slug: "contoh-beasiswa", title: "[CONTOH] Beasiswa Prestasi Nusantara", organizer: "Yayasan Contoh", deadline: d(40), scope: "external", levels: ["S1"], benefits: ["Biaya kuliah", "Uang saku bulanan"], fundingType: "fully_funded", city: "Bandung", country: "Indonesia", summary: "Data contoh untuk melihat tampilan halaman detail.", description: "Ini adalah **data contoh**. Hapus sebelum peluncuran.", eligibilityCriteria: [{ text: "Mahasiswa aktif S1", required: true }, { text: "IPK minimal 3,50", required: true }], applySteps: [{ title: "Siapkan berkas", description: "Transkrip, KTM, esai." }, { title: "Daftar di portal", description: "Kirim sebelum tenggat." }], requiredDocuments: ["Transkrip nilai", "Esai motivasi"], minGpa: 3.5 },
      { type: "competition" as const, slug: "contoh-kompetisi", title: "[CONTOH] Kompetisi Inovasi Mahasiswa", organizer: "Panitia Contoh", deadline: d(5), scope: "external", levels: ["S1", "D3"], benefits: ["Hadiah uang", "Sertifikat"], fundingType: "prize_money", attendanceMode: "hybrid", city: "Jakarta", country: "Indonesia", summary: "Data contoh — tenggat dekat untuk memperlihatkan status 'segera berakhir'.", description: "Data **contoh**.", eligibilityCriteria: [{ text: "Tim 2–4 orang", required: true }], applySteps: [{ title: "Bentuk tim", description: "" }, { title: "Unggah proposal", description: "" }] },
      { type: "research" as const, slug: "contoh-riset", title: "[CONTOH] Hibah Riset Dasar", organizer: "Lembaga Contoh", deadline: d(60), scope: "external", levels: ["S2", "S3"], benefits: ["Dana riset"], fundingType: "partially_funded", city: "Singapura", country: "Singapura", summary: "Data contoh.", description: "Data **contoh**.", eligibilityCriteria: [{ text: "Memiliki proposal riset", required: true }], applySteps: [{ title: "Kirim proposal", description: "" }] },
      { type: "career" as const, slug: "contoh-karier", title: "[CONTOH] Magang Data Analyst", organizer: "PT Contoh", deadline: d(-3), scope: "external", levels: ["S1"], benefits: ["Uang saku"], fundingType: "paid", attendanceMode: "onsite", city: "Bandung", country: "Indonesia", summary: "Data contoh — sudah lewat tenggat, tampil sebagai 'Ditutup' di bagian bawah.", description: "Data **contoh**.", eligibilityCriteria: [{ text: "Menguasai SQL", required: true }], applySteps: [{ title: "Kirim CV", description: "" }] },
    ];
    for (const s of samples) {
      await prisma.opportunity.upsert({ where: { slug: s.slug }, update: {}, create: { ...base, ...s } as never });
    }
    console.log("sample opportunities ensured (labelled [CONTOH])");
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
