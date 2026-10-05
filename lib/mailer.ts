// ============================================================
// SMTP mailer (GSIC mailbox) — configured purely via environment:
//   SMTP_HOST  SMTP_PORT  SMTP_USER  SMTP_PASSWORD  SMTP_FROM
//   (optional) SMTP_SECURE=true|false  (defaults: true when port 465)
// ============================================================
import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null = null;

export class MailConfigError extends Error {}

function transporter(): Transporter {
  if (cached) return cached;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new MailConfigError("SMTP is not configured (SMTP_HOST / SMTP_USER / SMTP_PASSWORD).");
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

export interface MailInput { to: string; subject: string; html: string; text: string }

export async function sendMail({ to, subject, html, text }: MailInput): Promise<void> {
  const from = process.env.SMTP_FROM || `GSIC Hub <${process.env.SMTP_USER}>`;
  await transporter().sendMail({ from, to, subject, html, text, headers: { "X-Auto-Response-Suppress": "OOF, AutoReply" } });
}
