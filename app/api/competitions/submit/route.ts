import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { HttpError, withErrorHandler, zodFieldErrors } from "@/lib/api-utils";
import { submitCompetitionSchema } from "@/lib/validation/submit-competition";
import { wibEndOfDay } from "@/lib/competitions";
import { uniqueSlug } from "@/lib/slugify";
import { notifyAdmins } from "@/lib/notify";

export const runtime = "nodejs";

/** A member suggests a competition. It stays unpublished until an admin approves it in the editor. */
export const POST = withErrorHandler(async (request: Request) => {
  const me = await requireUser(request);
  const parsed = submitCompetitionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Check the highlighted fields.", zodFieldErrors(parsed.error));
  const d = parsed.data;

  const recent = await prisma.opportunity.count({ where: { submittedById: me.id, createdAt: { gt: new Date(Date.now() - 86_400_000) } } });
  if (recent >= 5) throw new HttpError(429, "You have submitted 5 competitions today. Thank you! Try again tomorrow.");
  const deadline = wibEndOfDay(d.deadline);
  if (deadline.getTime() < Date.now()) throw new HttpError(422, "Registration has already closed.", { deadline: "Choose a future date" });
  const dupe = await prisma.opportunity.findFirst({ where: { type: "competition", title: { equals: d.title, mode: "insensitive" }, deadline: { gt: new Date() } }, select: { slug: true } });
  if (dupe) throw new HttpError(409, "This competition is already on the hub.", { title: "Already listed" });

  const slug = await uniqueSlug(d.title, async (s) => !!(await prisma.opportunity.findUnique({ where: { slug: s }, select: { id: true } })));
  const o = await prisma.opportunity.create({
    data: {
      type: "competition", title: d.title, slug, organizer: d.organizer, category: d.category, theme: d.theme || null,
      link: d.link, guidebookUrl: d.guidebookUrl || null, deadline, registrationFee: d.registrationFee || null,
      description: d.notes ? `<p>${d.notes.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!)}</p>` : "",
      isPublished: false, submittedById: me.id,
    },
  });
  await notifyAdmins({ kind: "admin_submission", title: `New competition to review: ${d.title}`, body: `${me.name ?? me.email} submitted it. Check the details and publish.`, path: `/admin?tab=opportunities&review=${o.id}`, dedupeKey: `submit:${o.id}` });
  return NextResponse.json({ ok: true, id: o.id }, { status: 201 });
});
