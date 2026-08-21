import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { collection } = body;

  try {
    if (collection === "opportunities") {
      const existing = await prisma.opportunity.count();
      if (existing === 0) {
        const { data } = body;
        if (data && Array.isArray(data)) {
          await prisma.opportunity.createMany({
            data: data.map((item: any) => ({
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
              posterUrl: item.posterUrl,
              status: item.status || "active",
              cpName: item.cpName,
              cpContact: item.cpContact,
            })),
          });
        }
      }
    } else if (collection === "curated") {
      const existing = await prisma.curatedOpportunity.count();
      if (existing === 0) {
        const { data } = body;
        if (data && Array.isArray(data)) {
          await prisma.curatedOpportunity.createMany({
            data: data.map((item: any) => ({
              id: item.id,
              title: item.title,
              type: item.type,
              organizer: item.organizer,
              monthOpen: item.monthOpen,
              description: item.description,
              link: item.link || "",
            })),
          });
        }
      }
    } else if (collection === "events") {
      const existing = await prisma.event.count();
      if (existing === 0) {
        const { data } = body;
        if (data && Array.isArray(data)) {
          for (const item of data) {
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
                modules: item.modules || [],
                speakers: item.speakers || [],
                hasPreTest: item.hasPreTest || false,
                hasPostTest: item.hasPostTest || false,
                preTestId: item.preTestId,
                postTestId: item.postTestId,
                preTestExplanation: item.preTestExplanation || "",
                postTestExplanation: item.postTestExplanation || "",
                createdBy: item.createdBy || "admin-seed",
              },
            });
          }
        }
      }
    } else if (collection === "tests") {
      const existing = await prisma.test.count();
      if (existing === 0) {
        const { data } = body;
        if (data && Array.isArray(data)) {
          await prisma.test.createMany({
            data: data.map((item: any) => ({
              id: item.id,
              eventId: item.eventId,
              type: item.type,
              title: item.title,
              description: item.description || null,
              questions: item.questions || [],
              durationMinutes: item.durationMinutes,
              passingScore: item.passingScore,
            })),
          });
        }
      }
    } else if (collection === "documents") {
      const existing = await prisma.document.count();
      if (existing === 0) {
        const { data } = body;
        if (data && Array.isArray(data)) {
          await prisma.document.createMany({
            data: data.map((item: any) => ({
              id: item.id,
              userId: item.userId || user.id,
              title: item.title,
              author: item.author || null,
              type: item.type,
              url: item.url,
            })),
          });
        }
      }
    } else if (collection === "adminAccounts") {
      const existing = await prisma.adminAccount.count();
      if (existing === 0) {
        const { data } = body;
        if (data && Array.isArray(data)) {
          await prisma.adminAccount.createMany({
            data: data.map((item: any) => ({
              id: item.id,
              email: item.email,
              name: item.name,
              role: item.role || "admin",
              isGenerated: item.isGenerated || true,
              generatedBy: item.generatedBy,
            })),
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Seed error:", e);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}