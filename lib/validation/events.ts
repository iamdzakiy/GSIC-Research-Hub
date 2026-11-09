// Event registration answers, shared by the registration form and POST /api/registrations.
import { z } from "zod";
import { emailSchema } from "@/lib/validation/auth";

export const BOOTCAMP_SCHEMES = ["PKM-RE", "PKM-KC", "PKM-GFT", "PKM-K"] as const;

const itbEmail = emailSchema.refine((e) => /(^|\.|@)itb\.ac\.id$/.test(e), "Use an ITB email address");

export const sandboxAnswers = z.object({
  hope: z.string().trim().max(300, "Keep it under 300 characters").optional(),
});

export const bootcampAnswers = z
  .object({
    scheme: z.enum(BOOTCAMP_SCHEMES, { errorMap: () => ({ message: "Choose a scheme" }) }),
    needsTeam: z.boolean().default(false),
    teamMembers: z.array(itbEmail).max(4, "At most 4 teammates").default([]),
    lecturer: z.string().trim().max(100, "Keep it under 100 characters").optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.needsTeam && d.teamMembers.length === 0) ctx.addIssue({ code: "custom", path: ["teamMembers"], message: "Add your teammates' ITB emails, or tick \"I need a team\"" });
    if (new Set(d.teamMembers).size !== d.teamMembers.length) ctx.addIssue({ code: "custom", path: ["teamMembers"], message: "Each teammate can be listed once" });
  });

export const registrationSchema = z.object({ eventId: z.string().trim().min(1).max(40), answers: z.record(z.unknown()).default({}) });
