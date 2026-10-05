// Shared request guard for /api/auth/* : JSON parsing, zod validation,
// optional e-mail-domain allow-list and rate limiting (per IP and per e-mail).
import "server-only";
import { NextResponse } from "next/server";
import type { ZodTypeAny, z } from "zod";
import { fieldErrors, isAllowedEmailDomain } from "@/lib/validation/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { MailConfigError } from "@/lib/mailer";

const WINDOW = 10 * 60_000;

export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status, headers: extra.retryAfterSec ? { "Retry-After": String(extra.retryAfterSec) } : undefined });

export async function guard<S extends ZodTypeAny>(
  req: Request,
  scope: string,
  schema: S
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; res: NextResponse }> {
  const ip = rateLimit(`${scope}:ip:${clientIp(req)}`, 15, WINDOW);
  if (!ip.ok) return { ok: false, res: fail(429, "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.", { retryAfterSec: ip.retryAfterSec }) };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, res: fail(400, "Permintaan tidak valid.") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, res: fail(422, "Periksa kembali isian Anda.", { fieldErrors: fieldErrors(parsed.error) }) };

  const email = (parsed.data as { email: string }).email;
  if (!isAllowedEmailDomain(email)) {
    return { ok: false, res: fail(422, "Domain email ini tidak diizinkan.", { fieldErrors: { email: "Gunakan email dari domain yang diizinkan (mis. ITB)." } }) };
  }
  const perEmail = rateLimit(`${scope}:email:${email}`, 3, WINDOW);
  if (!perEmail.ok) {
    return { ok: false, res: fail(429, `Email sudah dikirim beberapa kali. Coba lagi dalam ${Math.ceil(perEmail.retryAfterSec / 60)} menit.`, { retryAfterSec: perEmail.retryAfterSec }) };
  }
  return { ok: true, data: parsed.data };
}

export function mapServerError(e: unknown): NextResponse {
  if (e instanceof MailConfigError) {
    console.error("[auth] SMTP not configured:", (e as Error).message);
    return fail(503, "Layanan email belum dikonfigurasi. Hubungi admin GSIC.");
  }
  const msg = (e as Error)?.message ?? "";
  if (/SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL/.test(msg)) {
    console.error("[auth] Supabase env missing:", msg);
    return fail(503, "Konfigurasi autentikasi server belum lengkap (SUPABASE_SERVICE_ROLE_KEY). Hubungi admin GSIC.");
  }
  if ((e as { code?: string })?.code === "P2010" || /auth\.users/.test(msg)) {
    console.error("[auth] cannot read auth.users:", msg);
    return fail(503, "Layanan autentikasi belum siap (akses database). Hubungi admin GSIC.");
  }
  console.error("[auth] failure:", e);
  return fail(502, "Gagal mengirim email. Coba lagi sebentar lagi.");
}
