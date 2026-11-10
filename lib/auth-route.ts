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

/** Turns an unexpected server error into a message that points at the real cause. The full error is always logged. */
export function mapServerError(e: unknown): NextResponse {
  const err = e as { name?: string; code?: string; message?: string; responseCode?: number; command?: string };
  const msg = err?.message ?? "";
  if (e instanceof MailConfigError) {
    console.error("[auth] SMTP not configured:", msg);
    return fail(503, "Email delivery is not configured yet. Contact a GSIC admin.");
  }
  if (/SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL/.test(msg)) {
    console.error("[auth] Supabase env missing:", msg);
    return fail(503, "Server authentication is not fully configured (SUPABASE_SERVICE_ROLE_KEY). Contact a GSIC admin.");
  }
  // Database problems (for example the schema was not pushed after an update) are not email problems.
  if (/^PrismaClient/.test(err?.name ?? "") || /^P\d{4}$/.test(err?.code ?? "") || /does not exist in the current database|prisma/i.test(msg)) {
    console.error("[auth] database failure:", err?.code, msg);
    // The Prisma code is safe to show and tells an admin exactly what to do:
    //   P2021/P2022 table or column missing: run `prisma db push`.  P1000 bad password.  P1001/P1002 cannot reach the host.
    //   P1017/P2024 pooler closed the connection or ran out of connections.  P2002 unique conflict.
    const code = /^P\d{4}$/.test(err?.code ?? "") ? err.code : /does not exist/i.test(msg) ? "P2021/P2022" : "no code";
    // Which table/column is missing (names only, no data or credentials).
    const m: any = (err as any)?.meta ?? {};
    const where = m.column ?? m.table ?? (msg.match(/column `?([\w.]+)`? /i)?.[1] ?? msg.match(/table `?([\w.]+)`? /i)?.[1]);
    const detail = where ? `${code}: ${String(where).slice(0, 80)}` : code;
    return fail(503, `The database is not up to date or not reachable (${detail}). Contact a GSIC admin (schema push or DATABASE_URL).`, { dbCode: code, dbWhere: where ?? null });
  }
  // nodemailer: EAUTH (login refused), ECONNECTION/ETIMEDOUT/ESOCKET (cannot reach the server), EENVELOPE (bad address).
  if (err?.code === "EAUTH" || err?.responseCode === 535) {
    console.error("[auth] SMTP login refused:", msg);
    return fail(502, "The email server refused our login. Contact a GSIC admin (SMTP_USER / SMTP_PASSWORD).");
  }
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNREFUSED", "ENOTFOUND", "EDNS"].includes(err?.code ?? "")) {
    console.error("[auth] SMTP unreachable:", err.code, msg);
    return fail(502, "The email server could not be reached. Contact a GSIC admin (SMTP_HOST / SMTP_PORT / SMTP_SECURE).");
  }
  console.error("[auth] failure:", e);
  return fail(502, "Something went wrong on our side. Try again shortly, and contact a GSIC admin if it keeps happening.");
}
