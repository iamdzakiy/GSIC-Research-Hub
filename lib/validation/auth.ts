// Shared by the client forms AND the API routes (single source of truth).
import { z } from "zod";
import { profileFields, refineFacultyMajor } from "@/lib/validation/profile";

export const emailSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const nameSchema = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name must be at most 80 characters");

/** Step 1 of sign-up (account). */
export const accountSchema = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema });

/** Step 2 of sign-up (profile). Faculty and major are required here; everything else is optional. */
export const signupProfileSchema = profileFields
  .pick({ faculty: true, major: true, year: true, whatsapp: true, skills: true, softSkills: true, interests: true, archetype: true, bccRole: true })
  .extend({
    faculty: z.string({ required_error: "Choose your faculty or school" }).trim().min(1, "Choose your faculty or school"),
    major: z.string({ required_error: "Choose your major" }).trim().min(1, "Choose your major"),
  });

export const registerSchema = accountSchema.merge(signupProfileSchema).superRefine(refineFacultyMajor);
export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1, "Password is required") });
export const emailOnlySchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export type RegisterInput = z.infer<typeof registerSchema>;

/** Returns `{ field: message }` for the first issue of each field. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

/** Optional allow-list, e.g. AUTH_ALLOWED_EMAIL_DOMAINS="itb.ac.id,mahasiswa.itb.ac.id,gmail.com". Empty allows every domain. */
export function isAllowedEmailDomain(email: string, allowList = process.env.AUTH_ALLOWED_EMAIL_DOMAINS ?? ""): boolean {
  const domains = allowList.split(",").map((d) => d.trim().toLowerCase().replace(/^@/, "")).filter(Boolean);
  if (domains.length === 0) return true;
  const host = email.split("@")[1]?.toLowerCase() ?? "";
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}
