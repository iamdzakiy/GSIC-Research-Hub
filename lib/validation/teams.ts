// Shared by the team-call forms and the API routes.
import { z } from "zod";
import { INTEREST_IDS } from "@/lib/profile-options";

/** Roles are free text (suggestions come from the competition category), so "Pitch deck designer" is fine. */
const role = z.string().trim().min(2, "Name the role").max(40, "Keep the role under 40 characters");

const oneOf = (ids: string[], msg: string) => z.string().refine((v) => ids.includes(v), msg);

export const createCallSchema = z.object({
  title: z.string().trim().min(3, "Give the call a title (3+ characters)").max(100, "Keep the title under 100 characters"),
  competition: z.string().trim().min(2, "Name the competition, for example PKM-RE 2027").max(100, "Keep it under 100 characters"),
  opportunityId: z.string().trim().min(1).max(40).nullish(),
  eventId: z.string().trim().min(1).max(40).nullish(),
  interests: z.array(oneOf(INTEREST_IDS, "Unknown scheme")).max(5, "Pick at most 5").default([]),
  kind: z.enum(["team_needs_member", "looking_for_team"]).default("team_needs_member"),
  rolesNeeded: z.array(role).min(1, "Add at least one role").max(4, "At most 4 roles"),
  skillsNeeded: z.array(z.string().trim().min(1).max(30)).max(8, "At most 8 skills").default([]),
  commitment: z.string().trim().max(60, "Keep it under 60 characters").nullish(),
  currentTeamSize: z.coerce.number().int().min(1).max(10).nullish(),
  slots: z.coerce.number({ invalid_type_error: "Enter a number" }).int().min(1, "At least 1 slot").max(10, "At most 10 slots"),
  description: z.string().trim().min(10, "Describe the project in a sentence or two").max(600, "Keep it under 600 characters"),
  deadline: z.coerce.date({ invalid_type_error: "Choose a date" }).refine((d) => d.getTime() > Date.now(), "Choose a future date").refine((d) => d.getTime() < Date.now() + 366 * 864e5, "Choose a date within a year"),
});
export type CreateCallInput = z.infer<typeof createCallSchema>;

export const applySchema = z.object({
  role,
  message: z.string().trim().min(10, "Tell them briefly why you fit (10+ characters)").max(400, "Keep it under 400 characters"),
});

export const decisionSchema = z.object({ status: z.enum(["accepted", "declined", "withdrawn"]) });

export const reportSchema = z.object({ reason: z.string().trim().max(300).optional() });
export const callActionSchema = z.object({ action: z.enum(["close", "filled", "extend"]), days: z.coerce.number().int().min(1).max(60).optional() });
