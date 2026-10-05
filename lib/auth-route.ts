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
  if (!ip.ok) return { ok: false, res: fail(429, "Too many attempts. Try again in a few minutes.", { retryAfterSec: ip.retryAfterSec }) };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, res: fail(400, "Invalid request.") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, res: fail(422, "Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) }) };

  const email = (parsed.data as { email: string }).email;
  if (!isAllowedEmailDomain(email)) {
    return { ok: false, res: fail(422, "This email domain is not allowed.", { fieldErrors: { email: "Use an email address from an allowed domain (for example ITB)." } }) };
  }
  const perEmail = rateLimit(`${scope}:email:${email}`, 3, WINDOW);
  if (!perEmail.ok) {
    return { ok: false, res: fail(429, `We already sent several emails to this address. Try again in ${Math.ceil(perEmail.retryAfterSec / 60)} minutes.`, { retryAfterSec: perEmail.retryAfterSec }) };
  }
  return { ok: true, data: parsed.data };
}

export function mapServerError(e: unknown): NextResponse {
  if (e instanceof MailConfigError) {
    console.error("[auth] SMTP not configured:", (e as Error).message);
    return fail(503, "Email delivery is not configured yet. Contact a GSIC admin.");
  }
  const msg = (e as Error)?.message ?? "";
  if (/SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL/.test(msg)) {
    console.error("[auth] Supabase env missing:", msg);
    return fail(503, "Server authentication is not fully configured (SUPABASE_SERVICE_ROLE_KEY). Contact a GSIC admin.");
  }
  if ((e as { code?: string })?.code === "P2010" || /auth\.users/.test(msg)) {
    console.error("[auth] cannot read auth.users:", msg);
    return fail(503, "Authentication is not ready (database access). Contact a GSIC admin.");
  }
  console.error("[auth] failure:", e);
  return fail(502, "We could not send the email. Try again shortly.");
}
