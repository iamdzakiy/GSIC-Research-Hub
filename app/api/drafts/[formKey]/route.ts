import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler } from "@/lib/api-utils";
import { MAX_DRAFT_BYTES, draftBody, formKeySchema } from "@/lib/validation/drafts";

export const runtime = "nodejs";
type Ctx = { params: { formKey: string } };

function key(params: Ctx["params"]) {
  const k = formKeySchema.safeParse(decodeURIComponent(params.formKey));
  if (!k.success) throw new HttpError(422, "Bad form key.");
  return k.data;
}

export const GET = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const user = await requireUser(request);
  const d = await prisma.formDraft.findUnique({ where: { userId_formKey: { userId: user.id, formKey: key(params) } } });
  return NextResponse.json({ ok: true, draft: d ? { formKey: d.formKey, step: d.step, data: d.data, updatedAt: d.updatedAt.toISOString() } : null });
});

export const PUT = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const user = await requireUser(request);
  const formKey = key(params);
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_DRAFT_BYTES) throw new HttpError(413, "This draft is too large to save.");
  let json: unknown = null;
  try { json = JSON.parse(raw); } catch { /* handled below */ }
  const parsed = draftBody.safeParse(json);
  if (!parsed.success) throw new HttpError(422, "Bad draft.");
  const d = await prisma.formDraft.upsert({
    where: { userId_formKey: { userId: user.id, formKey } },
    create: { userId: user.id, formKey, data: parsed.data.data as never, step: parsed.data.step },
    update: { data: parsed.data.data as never, step: parsed.data.step },
  });
  return NextResponse.json({ ok: true, updatedAt: d.updatedAt.toISOString() });
});

export const DELETE = withErrorHandler(async (request: Request, { params }: Ctx) => {
  const user = await requireUser(request);
  await prisma.formDraft.deleteMany({ where: { userId: user.id, formKey: key(params) } });
  return NextResponse.json({ ok: true });
});
