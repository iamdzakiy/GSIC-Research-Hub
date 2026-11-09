import { z } from "zod";
import { isCategory } from "@/lib/competitions";

const url = z.string().trim().url("Paste a full link, starting with https://").max(500);

/** What a member can submit. An admin reviews it and fills in the rest before it is published. */
export const submitCompetitionSchema = z.object({
  title: z.string().trim().min(4, "Give the competition its full name").max(140),
  organizer: z.string().trim().min(2, "Who runs it?").max(120),
  category: z.string().refine(isCategory, "Pick a category"),
  theme: z.string().trim().max(200).optional().or(z.literal("")),
  link: url,
  guidebookUrl: url.optional().or(z.literal("")),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the registration close date"),
  registrationFee: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(600).optional().or(z.literal("")),
});
export type SubmitCompetitionInput = z.infer<typeof submitCompetitionSchema>;
