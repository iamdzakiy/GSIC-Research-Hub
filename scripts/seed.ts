import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  SEED_OPPORTUNITIES,
  SEED_CURATED,
  SEED_DOCUMENTS,
} from "../lib/data";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function seedOpportunities() {
  const existing = await prisma.opportunity.count();
  if (existing > 0) {
    console.log("⚠️ Opportunities already seeded. Skipping.");
    return;
  }
  for (const item of SEED_OPPORTUNITIES) {
    await prisma.opportunity.create({
      data: {
        id: item.id,
        type: item.type,
        title: item.title,
        slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").substring(0, 80),
        organizer: item.organizer,
        description: item.description,
        requiredSkills: item.requiredSkills || [],
        benefits: item.benefits || [],
        deadline: new Date(item.deadline),
        isAnnual: item.isAnnual || false,
        link: item.link || "",
        posterUrl: item.posterUrl ?? null,
        status: item.status || "active",
        cpName: item.cpName ?? null,
        cpContact: item.cpContact ?? null,
      },
    });
  }
  console.log(`✅ Seeded ${SEED_OPPORTUNITIES.length} opportunities.`);
}

async function seedCurated() {
  const existing = await prisma.curatedOpportunity.count();
  if (existing > 0) {
    console.log("⚠️ Curated opportunities already seeded. Skipping.");
    return;
  }
  for (const item of SEED_CURATED) {
    await prisma.curatedOpportunity.create({
      data: {
        id: item.id,
        title: item.title,
        type: item.type,
        organizer: item.organizer,
        monthOpen: item.monthOpen,
        description: item.description,
        link: item.link || "",
      },
    });
  }
  console.log(`✅ Seeded ${SEED_CURATED.length} curated opportunities.`);
}

async function seedDocuments() {
  const existing = await prisma.document.count();
  if (existing > 0) {
    console.log("⚠️ Documents already seeded. Skipping.");
    return;
  }
  for (const item of SEED_DOCUMENTS as unknown as Array<Record<string, unknown>>) {
    await prisma.document.create({
      data: {
        id: String(item.id),
        userId: String(item.userId),
        title: String(item.title),
        author: item.author ? String(item.author) : null,
        type: item.type as "report" | "portfolio" | "proposal",
        url: String(item.url),
      },
    });
  }
  console.log(`✅ Seeded ${SEED_DOCUMENTS.length} documents.`);
}

async function main() {
  try {
    console.log("🌱 Starting GSIC seed...");
    await seedOpportunities();
    await seedCurated();
    await seedDocuments();
    console.log("🎉 Seed complete!");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});