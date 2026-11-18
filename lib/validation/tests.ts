import { z } from "zod";

export const KINDS = ["pre_test", "post_test", "survey"] as const;
const date = z.union([z.string().datetime({ offset: true }), z.literal(""), z.null()]).optional().transform((v) => (v ? new Date(v) : v === "" || v === null ? null : undefined));

export const questionSchema = z.object({
  id: z.string().trim().min(1).max(60),
  type: z.enum(["multiple_choice", "essay", "likert", "nps", "single_choice", "multi_select", "short_text", "long_text"]),
  text: z.string().trim().min(1).max(1000),
  options: z.array(z.string().trim().min(1).max(300)).max(12).optional(),
  correctAnswer: z.string().max(300).optional(),
  points: z.number().min(0).max(1000).default(0),
  explanation: z.string().max(2000).optional(),
  required: z.boolean().optional(), scale: z.number().int().min(2).max(10).optional(),
  lowLabel: z.string().max(100).optional(), highLabel: z.string().max(100).optional(), maxLength: z.number().int().min(1).max(5000).optional(),
});
export const sectionSchema = z.object({ title: z.string().max(200).default(""), questions: z.array(questionSchema).max(60) });

export const testFields = z.object({
  eventId: z.string().min(1).max(60),
  kind: z.enum(KINDS),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  questions: z.array(questionSchema).max(100).default([]),
  sections: z.array(sectionSchema).max(20).nullable().optional(),
  durationMinutes: z.number().int().min(0).max(600).default(15),
  passingScore: z.number().int().min(0).max(100).default(0),
  key: z.string().trim().max(80).nullable().optional(), pairKey: z.string().trim().max(80).nullable().optional(), episode: z.number().int().min(1).max(20).nullable().optional(),
  access: z.enum(["registered", "signed_in"]).default("registered"),
  shuffleQuestions: z.boolean().default(false), shuffleOptions: z.boolean().default(false),
  showAnswersAfter: z.enum(["submit", "pair_closed", "never"]).default("submit"),
  opensAt: date, closesAt: date,
});
export type TestInput = z.infer<typeof testFields>;
export const testUpdate = testFields.partial().extend({ id: z.string().min(1), regenerateCode: z.boolean().optional(), openNow: z.boolean().optional(), closeNow: z.boolean().optional() });

/** Test.type is kept in step with kind for old code. Surveys use "post". */
export const legacyType = (kind: string): "pre" | "post" => (kind === "pre_test" ? "pre" : "post");
