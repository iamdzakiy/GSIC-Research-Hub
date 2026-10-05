// ============================================================
// Transactional email templates (inline styles, table layout, 600px max).
// Palette: GSIC blue #3352CD, mint #5CE3B6, cream #F2F8C9, navy #0B1120.
// All user-supplied values are HTML-escaped. No <style>, no web fonts, bulletproof button,
// so it renders the same in Gmail, Outlook and Apple Mail.
// ============================================================

export type EmailKind = "verify" | "magic" | "reset";

const BLUE = "#3352CD";
const MINT = "#5CE3B6";
const CREAM = "#F2F8C9";
const NAVY = "#0B1120";
const INK = "#0F172A";
const MUTED = "#475569";
const BORDER = "#E2E8F0";
const FONT = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

interface Copy { subject: string; preheader: string; title: string; body: string; cta: string; expiry: string; ignore: string; note?: string }

const hi = (name?: string) => (name ? `Hi ${esc(name.split(" ")[0]!)},` : "Hi,");

const COPY: Record<EmailKind, (name?: string) => Copy> = {
  verify: (name) => ({
    subject: "Confirm your GSIC Hub account",
    preheader: "Confirm this address to activate your account.",
    title: "Confirm your email address",
    body: `${hi(name)} thanks for signing up. Confirm this address to activate your account. After that you can save opportunities, register for events and follow your pre-test and post-test results.`,
    cta: "Confirm email",
    expiry: "This link expires after a short while and works once.",
    ignore: "If you did not create a GSIC Hub account, you can ignore this message. Nothing happens until the link is used.",
  }),
  magic: (name) => ({
    subject: "Your GSIC Hub sign-in link",
    preheader: "One tap to sign in. No password needed.",
    title: "Sign in to GSIC Hub",
    body: `${hi(name)} use the button below to sign in. You do not need your password.`,
    cta: "Sign in",
    expiry: "This link expires in about an hour and works once.",
    ignore: "If you did not ask for it, ignore this message. Your account is untouched.",
  }),
  reset: (name) => ({
    subject: "Reset your GSIC Hub password",
    preheader: "Choose a new password for your account.",
    title: "Reset your password",
    body: `${hi(name)} we received a request to reset the password on your account. Use the button below to choose a new one.`,
    cta: "Choose a new password",
    expiry: "This link expires in about an hour and works once.",
    ignore: "If you did not ask for this, ignore this message. Your password stays as it is.",
    note: "GSIC will never ask you for your password by email.",
  }),
};

export interface RenderedEmail { subject: string; html: string; text: string }

export function renderActionEmail(kind: EmailKind, opts: { url: string; name?: string; siteUrl: string }): RenderedEmail {
  const c = COPY[kind](opts.name);
  const url = esc(opts.url);
  const logo = `${opts.siteUrl}/favicon.png`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#EEF2F7;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF2F7;padding:28px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;border-radius:14px;overflow:hidden;background:#FFFFFF;border:1px solid ${BORDER};">
    <tr><td bgcolor="${NAVY}" style="background:${NAVY};padding:22px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;padding-right:12px;"><img src="${esc(logo)}" width="36" height="36" alt="GSIC" style="display:block;border:0;border-radius:8px;"></td>
        <td style="vertical-align:middle;font-family:${FONT};font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:-0.2px;">GSIC <span style="font-weight:500;color:${MINT};">Hub</span></td>
      </tr></table>
    </td></tr>
    <tr><td bgcolor="${MINT}" style="background:${MINT};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>
    <tr><td style="padding:36px 32px 32px;font-family:${FONT};">
      <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:700;color:${INK};letter-spacing:-0.4px;">${esc(c.title)}</h1>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:${MUTED};">${c.body}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;"><tr>
        <td align="center" bgcolor="${BLUE}" style="border-radius:8px;">
          <a href="${url}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">${esc(c.cta)}</a>
        </td>
      </tr></table>
      <p style="margin:0 0 6px;font-size:13px;line-height:1.55;color:${MUTED};">${esc(c.expiry)}</p>
      <p style="margin:0 0 ${c.note ? "20" : "24"}px;font-size:13px;line-height:1.55;color:${MUTED};">${esc(c.ignore)}</p>
      ${c.note ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td bgcolor="${CREAM}" style="background:${CREAM};border-radius:8px;padding:12px 16px;font-family:${FONT};font-size:13px;line-height:1.5;color:${NAVY};">${esc(c.note)}</td></tr></table>` : ""}
      <div style="height:1px;background:${BORDER};margin:0 0 18px;"></div>
      <p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:#64748B;">If the button does not work, copy this link into your browser:</p>
      <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${url}" style="color:${BLUE};text-decoration:underline;">${url}</a></p>
    </td></tr>
    <tr><td bgcolor="#F8FAFC" style="background:#F8FAFC;border-top:1px solid ${BORDER};padding:18px 32px;font-family:${FONT};font-size:12px;line-height:1.6;color:#64748B;">
      Ganesha Students Innovation Center, Institut Teknologi Bandung<br>This is an automated message. Replies are not monitored.
    </td></tr>
  </table>
</td></tr></table></body></html>`;

  const text = [c.title, "", c.body.replace(/&[a-z#0-9]+;/g, ""), "", `${c.cta}: ${opts.url}`, "", c.expiry, c.ignore, ...(c.note ? [c.note] : []), "", "GSIC Hub, Institut Teknologi Bandung"].join("\n");
  return { subject: c.subject, html, text };
}
