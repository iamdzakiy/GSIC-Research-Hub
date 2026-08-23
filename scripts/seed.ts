import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  SEED_OPPORTUNITIES,
  SEED_CURATED,
  SEED_EVENTS,
  SEED_TESTS,
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

async function seedEvents() {
  const existing = await prisma.event.count();
  if (existing > 0) {
    console.log("⚠️ Events already seeded. Skipping.");
    return;
  }
  for (const item of SEED_EVENTS) {
    await prisma.event.create({
      data: {
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        shortDescription: item.shortDescription,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        registrationDeadline: new Date(item.registrationDeadline),
        location: item.location,
        maxParticipants: item.maxParticipants,
        currentParticipants: item.currentParticipants || 0,
        status: item.status || "upcoming",
        clusters: item.clusters || [],
        modules: item.modules as unknown as object,
        speakers: item.speakers as unknown as object,
        hasPreTest: item.hasPreTest || false,
        hasPostTest: item.hasPostTest || false,
        preTestId: item.preTestId ?? null,
        postTestId: item.postTestId ?? null,
        preTestExplanation: item.preTestExplanation || "",
        postTestExplanation: item.postTestExplanation || "",
        createdBy: item.createdBy || "admin-seed",
      },
    });
  }
  console.log(`✅ Seeded ${SEED_EVENTS.length} events.`);
}

async function seedTests() {
  const existing = await prisma.test.count();
  if (existing > 0) {
    console.log("⚠️ Tests already seeded. Skipping.");
    return;
  }
  for (const item of SEED_TESTS) {
    await prisma.test.create({
      data: {
        id: item.id,
        eventId: item.eventId,
        type: item.type,
        title: item.title,
        description: item.description || null,
        questions: item.questions as unknown as object,
        durationMinutes: item.durationMinutes,
        passingScore: item.passingScore,
      },
    });
  }
  console.log(`✅ Seeded ${SEED_TESTS.length} tests.`);
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
    await seedEvents();
    await seedTests();
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