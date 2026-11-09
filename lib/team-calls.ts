// Server helpers for team calls: expiry, serialisation with contact-reveal rules, e-mail copy.
import "server-only";
import { prisma } from "@/lib/prisma";
import { signedCvUrl } from "@/lib/cv";
import { notify } from "@/lib/notify";
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

/** Owner: someone responded to their post (in-app + e-mail). */
export async function notifyOwnerOfApplication(o: { ownerId: string; ownerName: string | null; applicant: string; callId: string; callTitle: string; role: string; lookingForTeam?: boolean }) {
  const first = o.ownerName?.split(/\s+/)[0] || "there";
  const what = o.lookingForTeam ? `invited you to join their team as ${roleLabel(o.role)}` : `wants to join as ${roleLabel(o.role)}`;
  await notify(o.ownerId, {
    kind: "partner_response",
    title: `${o.applicant} responded to "${o.callTitle}"`,
    body: `${o.applicant} ${what}.`,
    path: `/partners/${o.callId}?tab=responses`,
    email: {
      subject: `New response to "${o.callTitle}"`,
      preheader: `${o.applicant} ${what}.`,
      title: "You have a new response",
      body: `Hi ${esc(first)}, ${esc(o.applicant)} ${esc(what)} on your Seeking Partner post "${esc(o.callTitle)}". Review their profile and decide.`,
      cta: "Review the response",
    },
  });
}

/** Responder: accepted or declined (in-app + e-mail). */
export async function notifyApplicantOfDecision(o: { applicantId: string; applicantName: string | null; callId: string; callTitle: string; accepted: boolean }) {
  const first = o.applicantName?.split(/\s+/)[0] || "there";
  await notify(o.applicantId, o.accepted
    ? {
        kind: "partner_decision",
        title: `Accepted: "${o.callTitle}"`,
        body: "Contact details are now visible to both of you.",
        path: `/partners/${o.callId}`,
        email: {
          subject: `You are in: "${o.callTitle}"`,
          preheader: "Your response was accepted. Contact details are now visible.",
          title: "Your response was accepted",
          body: `Hi ${esc(first)}, the owner of "${esc(o.callTitle)}" accepted you. Their WhatsApp number is now visible on the post. Introduce yourself briefly and agree on next steps.`,
          cta: "Open the post",
        },
      }
    : {
        kind: "partner_decision",
        title: `Update on "${o.callTitle}"`,
        body: "The owner decided not to move forward this time.",
        path: "/partners",
        email: {
          subject: `Update on "${o.callTitle}"`,
          preheader: "The owner decided not to move forward this time.",
          title: "Your response was not accepted",
          body: `Hi ${esc(first)}, the owner of "${esc(o.callTitle)}" decided not to move forward this time. Other posts may fit you better.`,
          cta: "Browse Seeking Partner",
        },
      });
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
