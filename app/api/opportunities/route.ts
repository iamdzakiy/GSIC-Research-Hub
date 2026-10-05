import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";
import { slugify } from "@/lib/slugify";
import { opportunityInput } from "@/lib/validation/opportunity";
import { fieldErrors } from "@/lib/validation/auth";

const JSON_KEYS = ["eligibilityCriteria", "applySteps", "selectionStages", "faqs", "quickFacts", "socialLinks", "timeline"] as const;

export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const type = url.searchParams.get("type")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const search = url.searchParams.get("search")?.trim() || "";
  const { skip, take } = parsePagination(url);

  if (slug) {
    const opp = await prisma.opportunity.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
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
    prisma.opportunity.findMany({ where, orderBy: { deadline: "asc" }, skip, take }),
    prisma.opportunity.count({ where }),
  ]);
  return NextResponse.json({ opportunities, total, page: Math.floor(skip / take) + 1, pageSize: take });
});

/** Validated payload -> Prisma data (only keys that were actually sent). */
function toData(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || k === "slug") continue;
    if (k === "deadline") out.deadline = new Date(v as string);
    else if (k === "link" || k === "contactEmail") out[k] = v ? v : null;
    else if ((JSON_KEYS as readonly string[]).includes(k)) out[k] = v as Prisma.InputJsonValue;
    else out[k] = v;
  }
  return out;
}

export const POST = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const parsed = opportunityInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data", fieldErrors: fieldErrors(parsed.error) }, { status: 400 });

  const baseSlug = parsed.data.slug || slugify(parsed.data.title) || "opportunity";
  let slug = baseSlug;
  for (let i = 1; await prisma.opportunity.findUnique({ where: { slug } }); i++) slug = `${baseSlug}-${i}`;

  const created = await prisma.opportunity.create({ data: { ...(toData(parsed.data) as Prisma.OpportunityCreateInput), slug } });
  return NextResponse.json(created, { status: 201 });
});

export const PUT = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id, ...rest } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const parsed = opportunityInput.partial().safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data", fieldErrors: fieldErrors(parsed.error) }, { status: 400 });

  const data = toData(parsed.data) as Prisma.OpportunityUpdateInput;
  if (parsed.data.slug) data.slug = slugify(parsed.data.slug);
  const updated = await prisma.opportunity.update({ where: { id }, data });
  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (request: Request) => {
  await requireAdmin(request);
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.opportunity.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
