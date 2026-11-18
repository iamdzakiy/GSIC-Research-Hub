// Event registration answers, shared by the registration form and POST /api/registrations.
import { z } from "zod";
import { emailSchema } from "@/lib/validation/auth";
import { nimError, storedNim } from "@/lib/nim";

export const BOOTCAMP_SCHEMES = ["PKM-RE", "PKM-KC", "PKM-GFT", "PKM-K"] as const;

const itbEmail = emailSchema.refine((e) => /(^|\.|@)itb\.ac\.id$/.test(e), "Use an ITB email address");

export const sandboxAnswers = z.object({
  hope: z.string().trim().max(300, "Keep it under 300 characters").optional(),
});

/** A teammate is identified by NIM. A name and an ITB email are asked only when the NIM does not belong to a Hub user (the server decides). */
export const teamMemberSchema = z.object({
  nim: z.string().trim().superRefine((v, ctx) => { const e = nimError("ITB", v); if (e) ctx.addIssue({ code: "custom", message: e }); }).transform((v) => storedNim("ITB", v)),
  name: z.string().trim().max(100, "Keep it under 100 characters").optional(),
  email: z.union([itbEmail, z.literal("")]).optional(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

export const bootcampAnswers = z
  .object({
    scheme: z.enum(BOOTCAMP_SCHEMES, { errorMap: () => ({ message: "Choose a scheme" }) }),
    needsTeam: z.boolean().default(false),
    teamMembers: z.array(teamMemberSchema).max(4, "At most 4 teammates").default([]),
    lecturer: z.string().trim().max(100, "Keep it under 100 characters").optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.needsTeam && d.teamMembers.length === 0) ctx.addIssue({ code: "custom", path: ["teamMembers"], message: "Add your teammates by NIM, or tick \"I need a team\"" });
    if (new Set(d.teamMembers.map((m) => m.nim)).size !== d.teamMembers.length) ctx.addIssue({ code: "custom", path: ["teamMembers"], message: "Each teammate can be listed once" });
  });

export const registrationSchema = z.object({ eventId: z.string().trim().min(1).max(40), answers: z.record(z.unknown()).default({}) });

/** Shape of an unsent registration, as the form holds it. Checked with `.partial()` when a draft is restored. */
export const registrationDraftSchema = z.object({
  scheme: z.enum(BOOTCAMP_SCHEMES),
  needsTeam: z.boolean(),
  members: z.array(z.object({ nim: z.string().max(20), name: z.string().max(100), email: z.string().max(120) })).max(4),
  lecturer: z.string().max(100),
  hope: z.string().max(300),
});
export type RegistrationDraft = z.infer<typeof registrationDraftSchema>;
