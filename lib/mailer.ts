// ============================================================
// Mailer — configured purely via environment. Two providers, first one that is set wins:
//   1. Resend (HTTPS API, no mailbox needed):  RESEND_API_KEY  and  MAIL_FROM="GSIC Hub <no-reply@your-verified-domain>"
//   2. SMTP (GSIC mailbox or Gmail app password):  SMTP_HOST  SMTP_PORT  SMTP_USER  SMTP_PASSWORD  SMTP_FROM
//      (optional) SMTP_SECURE=true|false  (defaults: true when port 465)
// ============================================================
import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null = null;

export class MailConfigError extends Error {}

function transporter(): Transporter {
  if (cached) return cached;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER } = process.env;
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD || process.env.SMTP_PASS; // SMTP_PASS is accepted as an alias
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new MailConfigError("Email is not configured (set RESEND_API_KEY + MAIL_FROM, or SMTP_HOST / SMTP_USER / SMTP_PASSWORD).");
  }
  const port = Number(SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  cached = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    pool: true,
    maxConnections: 3,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return cached;
}

export interface MailInput { to: string; subject: string; html: string; text: string; attachments?: { filename: string; content: string; contentType: string }[]; headers?: Record<string, string> }

async function sendViaResend(key: string, from: string, { to, subject, html, text, attachments, headers }: MailInput): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [to], subject, html, text,
      headers: { "X-Auto-Response-Suppress": "OOF, AutoReply", ...headers },
      attachments: attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64"), content_type: a.contentType })),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // 401/403 = bad key or unverified sender domain; 422 = bad address or sender. Shown in the server log only.
    const err = new Error(`Resend ${res.status}: ${body.slice(0, 300)}`) as Error & { code?: string; responseCode?: number };
    if (res.status === 401 || res.status === 403) err.code = "EAUTH";
    throw err;
  }
}

export async function sendMail(mail: MailInput): Promise<void> {
  const { to, subject, html, text, attachments, headers } = mail;
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const from = process.env.MAIL_FROM || process.env.SMTP_FROM;
    if (!from) throw new MailConfigError("MAIL_FROM is not set (for example MAIL_FROM=\"GSIC Hub <no-reply@your-domain>\").");
    return sendViaResend(resendKey, from, mail);
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_FROM || `GSIC Hub <${process.env.SMTP_USER}>`;
  await transporter().sendMail({ from, to, subject, html, text, attachments, headers: { "X-Auto-Response-Suppress": "OOF, AutoReply", ...headers } });
}

/** Best-effort send with a bounded wait. Never throws: a mail problem must not fail the caller's action. */
export async function trySendMail(mail: MailInput, timeoutMs = 8_000): Promise<boolean> {
  try {
    await Promise.race([sendMail(mail), new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), timeoutMs))]);
    return true;
  } catch (e) {
    console.error("[mail] not sent:", (e as Error).message);
    return false;
  }
}
