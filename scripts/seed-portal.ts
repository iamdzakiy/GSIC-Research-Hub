/**
 * Seeds the portal's link collection (and optionally sample opportunities).
 *   npx tsx scripts/seed-portal.ts              -> links only (idempotent upsert by URL)
 *   SEED_SAMPLES=1 npx tsx scripts/seed-portal.ts -> + 4 clearly labelled "[SAMPLE]" opportunities
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
      { type: "scholarship" as const, slug: "sample-scholarship", title: "[SAMPLE] Nusantara Merit Scholarship", organizer: "Sample Foundation", deadline: d(40), scope: "external", levels: ["S1"], benefits: ["Tuition", "Monthly stipend"], fundingType: "fully_funded", city: "Bandung", country: "Indonesia", summary: "Sample data for previewing the detail page layout.", description: "This is **sample data**. Delete it before launch.", eligibilityCriteria: [{ text: "Currently enrolled undergraduate student", required: true }, { text: "Minimum GPA of 3.50", required: true }], applySteps: [{ title: "Prepare documents", description: "Transcript, student ID, essay." }, { title: "Apply on the portal", description: "Submit before the deadline." }], requiredDocuments: ["Academic transcript", "Motivation essay"], minGpa: 3.5 },
      { type: "competition" as const, slug: "sample-competition", title: "[SAMPLE] Student Innovation Competition", organizer: "Sample Organizing Committee", deadline: d(5), scope: "external", levels: ["S1", "D3"], benefits: ["Prize money", "Certificate"], fundingType: "prize_money", attendanceMode: "hybrid", city: "Jakarta", country: "Indonesia", summary: "Sample data with a near deadline, to show the \"closing soon\" status.", description: "**Sample** data.", eligibilityCriteria: [{ text: "Team of 2-4 people", required: true }], applySteps: [{ title: "Form a team", description: "" }, { title: "Upload the proposal", description: "" }] },
      { type: "research" as const, slug: "sample-research", title: "[SAMPLE] Basic Research Grant", organizer: "Sample Institute", deadline: d(60), scope: "external", levels: ["S2", "S3"], benefits: ["Research funding"], fundingType: "partially_funded", city: "Singapore", country: "Singapore", summary: "Sample data.", description: "**Sample** data.", eligibilityCriteria: [{ text: "Has a research proposal", required: true }], applySteps: [{ title: "Submit the proposal", description: "" }] },
      { type: "career" as const, slug: "sample-career", title: "[SAMPLE] Data Analyst Internship", organizer: "Sample Company Ltd.", deadline: d(-3), scope: "external", levels: ["S1"], benefits: ["Stipend"], fundingType: "paid", attendanceMode: "onsite", city: "Bandung", country: "Indonesia", summary: "Sample data with a past deadline, shown as \"Closed\" at the bottom of the list.", description: "**Sample** data.", eligibilityCriteria: [{ text: "Proficient in SQL", required: true }], applySteps: [{ title: "Submit your CV", description: "" }] },
    ];
    for (const s of samples) {
      await prisma.opportunity.upsert({ where: { slug: s.slug }, update: {}, create: ({ ...base, ...s } as unknown as Parameters<typeof prisma.opportunity.upsert>[0]["create"]) });
    }
    console.log("sample opportunities ensured (labelled [SAMPLE])");
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
