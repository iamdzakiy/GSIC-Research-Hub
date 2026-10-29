// Profile fields shared by sign-up (API + form) and the profile editor. English messages only.
import { z } from "zod";
import { FACULTY_MAJOR_MAP } from "@/lib/types";
import { FIELD_IDS, HARD_SKILLS, INTEREST_IDS, PKM_ROLE_IDS, PREFERRED_ROLE_IDS, SOFT_SKILLS, normalizeLinkedIn } from "@/lib/profile-options";

const pick = (allowed: readonly string[], max: number) =>
  z.array(z.string()).max(max, `Pick at most ${max}`).transform((a) => Array.from(new Set(a.filter((x) => allowed.includes(x)))));

const phone = z
  .string()
  .trim()
  .max(20)
  .regex(/^[+0-9 ()-]*$/, "Use digits, spaces, + or - only")
  .optional();

/** Required LinkedIn profile URL, normalised to https://www.linkedin.com/in/<slug>. */
export const linkedinSchema = z
  .string({ required_error: "LinkedIn profile is required" })
  .trim()
  .min(1, "LinkedIn profile is required")
  .transform((v, ctx) => {
    const n = normalizeLinkedIn(v);
    if (!n) ctx.addIssue({ code: "custom", message: "Use a link like linkedin.com/in/your-name" });
    return n ?? v;
  });

/** Fields the user can edit. Everything is optional so partial updates work. */
export const profileFields = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name must be at most 80 characters").optional(),
  faculty: z.string().trim().max(20).optional(),
  major: z.string().trim().max(80).optional(),
  majorCode: z.string().trim().max(10).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  whatsapp: phone,
  avatarUrl: z.string().trim().url().max(2000).refine((u) => /^https?:\/\//i.test(u), "Must be an http(s) URL").nullish(),
  classcardTheme: z.enum(["blue", "mint", "cream", "dark", "purple", "sunset"]).optional(),
  bio: z.string().trim().max(500, "Bio must be at most 500 characters").optional(),
  skills: pick(HARD_SKILLS, 12).optional(), // hard skills (column kept as `skills`)
  softSkills: pick(SOFT_SKILLS, 8).optional(),
  interests: pick(INTEREST_IDS, 8).optional(),
  preferredRole: z.string().nullish().refine((v) => !v || PREFERRED_ROLE_IDS.includes(v), "Unknown role"),
  pkmRole: z.string().nullish().refine((v) => !v || PKM_ROLE_IDS.includes(v), "Unknown PKM role"),
  fields: pick(FIELD_IDS, 7).optional(),
  institution: z.string().trim().min(1).max(80).optional(),
  linkedinUrl: linkedinSchema.optional(),
  // sync fields written by AuthContext
  emailConfirmed: z.boolean().optional(),
  provider: z.string().max(30).optional(),
  lastSignInAt: z.string().optional(),
});

/** Checks that the chosen major belongs to the chosen faculty/school. */
export function refineFacultyMajor<T extends { faculty?: string; major?: string }>(d: T, ctx: z.RefinementCtx) {
  if (d.faculty) {
    const majors = FACULTY_MAJOR_MAP[d.faculty];
    if (!majors) return ctx.addIssue({ code: "custom", path: ["faculty"], message: "Choose a faculty or school from the list" });
    if (d.major && !majors.some((m) => m.name === d.major)) ctx.addIssue({ code: "custom", path: ["major"], message: "Choose a major from the selected faculty or school" });
  } else if (d.major) ctx.addIssue({ code: "custom", path: ["faculty"], message: "Choose a faculty or school first" });
}

export const profileUpdateSchema = profileFields.superRefine(refineFacultyMajor);

/** Prisma `data` object from a validated profile (undefined values are skipped). */
export function profileToData(p: z.infer<typeof profileFields>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => { if (v !== undefined) out[k] = v; };
  set("name", p.name); set("faculty", p.faculty); set("major", p.major);
  if (p.faculty && p.major) {
    set("majorCode", FACULTY_MAJOR_MAP[p.faculty]?.find((m) => m.name === p.major)?.code);
  }
  set("year", p.year); set("whatsapp", p.whatsapp); set("avatarUrl", p.avatarUrl); set("classcardTheme", p.classcardTheme);
  set("bio", p.bio); set("skills", p.skills); set("softSkills", p.softSkills); set("interests", p.interests);
  if (p.preferredRole !== undefined) out.preferredRole = p.preferredRole || null;
  if (p.pkmRole !== undefined) out.pkmRole = p.pkmRole || null;
  set("fields", p.fields); set("institution", p.institution); set("linkedinUrl", p.linkedinUrl);
  set("emailConfirmed", p.emailConfirmed); set("provider", p.provider);
  if (p.lastSignInAt) { const d = new Date(p.lastSignInAt); if (!Number.isNaN(+d)) out.lastSignInAt = d; }
  return out;
}
