// Server helpers for team calls: expiry, serialisation with contact-reveal rules, e-mail copy.
import "server-only";
import { prisma } from "@/lib/prisma";
import { signedCvUrl } from "@/lib/cv";
import { renderEmail } from "@/lib/email-templates";
import { trySendMail } from "@/lib/mailer";
import { PREFERRED_ROLES, labelOf } from "@/lib/profile-options";
import type { Prisma } from "../generated/prisma/client";

export const MAX_OPEN_CALLS = 5;

/** Calls past their deadline close themselves the next time anyone reads. */
export async function closeExpired() {
  await prisma.teamCall.updateMany({ where: { status: "open", deadline: { lt: new Date() } }, data: { status: "closed" } });
}

export const PERSON = { id: true, name: true, major: true, faculty: true, institution: true, linkedinUrl: true, preferredRole: true, cvPath: true, whatsapp: true } as const;
type Person = Prisma.UserGetPayload<{ select: typeof PERSON }>;

/** Name, role, major, LinkedIn and CV are always visible; WhatsApp only when `reveal` is true. */
export async function personView(u: Person, opts: { reveal: boolean; withCv: boolean }) {
  return {
    id: u.id, name: u.name ?? "Member", major: u.major, faculty: u.faculty, institution: u.institution, linkedinUrl: u.linkedinUrl,
    preferredRole: u.preferredRole, hasCv: !!u.cvPath,
    cvUrl: opts.withCv ? await signedCvUrl(u.cvPath) : null,
    whatsapp: opts.reveal ? u.whatsapp : null,
  };
}

const roleLabel = (id: string) => labelOf(PREFERRED_ROLES, id);

export async function notifyOwnerOfApplication(opts: { to: string; ownerName: string | null; applicant: string; callTitle: string; role: string; siteUrl: string }) {
  const first = opts.ownerName?.split(/\s+/)[0] || "there";
  await trySendMail({
    to: opts.to,
    ...renderEmail({
      subject: `New application for "${opts.callTitle}"`,
      preheader: `${opts.applicant} wants to join as ${roleLabel(opts.role)}.`,
      title: "You have a new applicant",
      body: `Hi ${esc(first)}, ${esc(opts.applicant)} applied to your call "${esc(opts.callTitle)}" as ${esc(roleLabel(opts.role))}. Review their profile and decide.`,
      cta: "Review application",
      url: `${opts.siteUrl}/teams?tab=mine`,
    }, opts.siteUrl),
  });
}

export async function notifyApplicantOfDecision(opts: { to: string; applicantName: string | null; callTitle: string; accepted: boolean; siteUrl: string }) {
  const first = opts.applicantName?.split(/\s+/)[0] || "there";
  await trySendMail({
    to: opts.to,
    ...renderEmail(opts.accepted
      ? {
          subject: `You are in: "${opts.callTitle}"`,
          preheader: "Your application was accepted. Contact details are now visible.",
          title: "Your application was accepted",
          body: `Hi ${esc(first)}, the owner of "${esc(opts.callTitle)}" accepted you. Their WhatsApp number is now visible on your applications page. Introduce yourself briefly and agree on next steps.`,
          cta: "Open my applications",
          url: `${opts.siteUrl}/teams?tab=applied`,
        }
      : {
          subject: `Update on "${opts.callTitle}"`,
          preheader: "The owner decided not to move forward this time.",
          title: "Your application was not accepted",
          body: `Hi ${esc(first)}, the owner of "${esc(opts.callTitle)}" decided not to move forward with your application. Other open calls may fit you better.`,
          cta: "Browse open calls",
          url: `${opts.siteUrl}/teams`,
        }, opts.siteUrl),
  });
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
