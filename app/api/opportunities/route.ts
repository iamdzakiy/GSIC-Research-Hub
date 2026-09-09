import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";
import { slugify } from "@/lib/slugify";

export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const type = url.searchParams.get("type")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const search = url.searchParams.get("search")?.trim() || "";
  const { skip, take } = parsePagination(url);

  if (slug) {
    const opp = await prisma.opportunity.findUnique({ where: { slug } });
    return NextResponse.json(opp ? [opp] : []);
  }

  const where: Prisma.OpportunityWhereInput = {
    ...(type ? { type: type as never } : {}),
    ...(status ? { status: status as never } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { organizer: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: { deadline: "asc" },
      skip,
      take,
    }),
    prisma.opportunity.count({ where }),
  ]);
  return NextResponse.json({ opportunities, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const body = await request.json();
  if (!body.title || !body.type || !body.organizer || !body.deadline) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const baseSlug = body.slug || slugify(body.title);
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.opportunity.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const newOpp = await prisma.opportunity.create({
    data: buildOpportunityData(body, slug),
  });
  return NextResponse.json(newOpp, { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.opportunity.update({
    where: { id },
    data: {
      ...buildOpportunityData(data, undefined),
      slug:
        data.slug || (data.title ? slugify(data.title) : undefined),
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    },
  });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.opportunity.delete({ where: { id } });
  return NextResponse.json({ success: true });
});

/**
 * Maps an incoming body to a Prisma data object, correctly coercing the JSON
 * `timeline` column and only including present rich-text fields.
 */
function buildOpportunityData(body: Record<string, unknown>, slug?: string) {
  const data: Prisma.OpportunityCreateInput = {
    type: body.type as never,
    title: body.title as string,
    slug: slug || (body.slug as string),
    organizer: body.organizer as string,
    description: (body.description as string) || "",
    requiredSkills: Array.isArray(body.requiredSkills) ? (body.requiredSkills as string[]) : [],
    benefits: Array.isArray(body.benefits) ? (body.benefits as string[]) : [],
    deadline: new Date(body.deadline as string),
    isAnnual: !!body.isAnnual,
    status: (body.status as never) || "active",
  };

  const optionalString = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
  const optionalJson = (v: unknown) => (Array.isArray(v) ? (v as never) : undefined);
  const fields: Record<string, unknown> = {
    link: optionalString(body.link) ?? (body.link === null ? null : undefined),
    posterUrl: optionalString(body.posterUrl) ?? (body.posterUrl === null ? null : undefined),
    cpName: optionalString(body.cpName),
    cpContact: optionalString(body.cpContact),
    location: optionalString(body.location),
    programBenefits: optionalString(body.programBenefits),
    eligibility: optionalString(body.eligibility),
    howToApply: optionalString(body.howToApply),
    timeline: optionalJson(body.timeline),
  };

  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  ) as Prisma.OpportunityCreateInput;
}