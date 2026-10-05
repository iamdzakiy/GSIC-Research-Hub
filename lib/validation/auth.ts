// Shared by the client forms AND the API routes (single source of truth).
import { z } from "zod";

export const emailSchema = z
  .string({ required_error: "Email wajib diisi" })
  .trim()
  .toLowerCase()
  .min(1, "Email wajib diisi")
  .max(254, "Email terlalu panjang")
  .email("Format email tidak valid");

export const passwordSchema = z
  .string({ required_error: "Kata sandi wajib diisi" })
  .min(8, "Minimal 8 karakter")
  .max(72, "Maksimal 72 karakter")
  .regex(/[A-Za-z]/, "Harus mengandung huruf")
  .regex(/[0-9]/, "Harus mengandung angka");

export const nameSchema = z
  .string({ required_error: "Nama wajib diisi" })
  .trim()
  .min(2, "Nama minimal 2 karakter")
  .max(80, "Nama maksimal 80 karakter");

export const registerSchema = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema });
export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1, "Kata sandi wajib diisi") });
export const emailOnlySchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Kata sandi tidak sama" });

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

/** Optional allow-list, e.g. AUTH_ALLOWED_EMAIL_DOMAINS="itb.ac.id,mahasiswa.itb.ac.id,gmail.com". Empty = allow all. */
export function isAllowedEmailDomain(email: string, allowList = process.env.AUTH_ALLOWED_EMAIL_DOMAINS ?? ""): boolean {
  const domains = allowList.split(",").map((d) => d.trim().toLowerCase().replace(/^@/, "")).filter(Boolean);
  if (domains.length === 0) return true;
  const host = email.split("@")[1]?.toLowerCase() ?? "";
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}
