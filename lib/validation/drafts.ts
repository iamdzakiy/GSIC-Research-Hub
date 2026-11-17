import { z } from "zod";

/** Form keys look like `event:pkm-bootcamp-2027`, `partner-post`, `competition-submit`, `profile`. */
export const formKeySchema = z.string().regex(/^[a-z0-9][a-z0-9:_.-]{0,79}$/, "Bad form key");
export const MAX_DRAFT_BYTES = 20 * 1024;

export const draftBody = z.object({
  data: z.record(z.unknown()),
  step: z.number().int().min(1).max(20).default(1),
});
export type DraftBody = z.infer<typeof draftBody>;

export interface DraftRow { formKey: string; step: number; updatedAt: string; data: Record<string, unknown> }
