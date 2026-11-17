import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";

export const runtime = "nodejs";

/** The signed-in user's drafts, newest first, for the dashboard "Drafts" block. */
export const GET = withErrorHandler(async (request: Request) => {
  const user = await requireUser(request);
  const rows = await prisma.formDraft.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 20 });
  return NextResponse.json({ ok: true, drafts: rows.map((d) => ({ formKey: d.formKey, step: d.step, updatedAt: d.updatedAt.toISOString() })) });
});
