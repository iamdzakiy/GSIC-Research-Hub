// ============================================================
// Transactional email templates (inline-styled, table layout, 600px).
// Light, high-contrast, branded with the GSIC logo. All user-supplied values
// are HTML-escaped. Works in Gmail / Outlook / Apple Mail (no <style>,
// no web fonts, bulletproof button).
// ============================================================

export type EmailKind = "verify" | "magic" | "reset";

const BRAND = "#3352CD";
const INK = "#0F172A";
const MUTED = "#475569";
const BORDER = "#E2E8F0";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

interface Copy { subject: string; preheader: string; title: string; body: string; cta: string; expiry: string; ignore: string }

const COPY: Record<EmailKind, (name?: string) => Copy> = {
  verify: (name) => ({
    subject: "Verifikasi email akun GSIC Hub",
    preheader: "Satu langkah lagi untuk mengaktifkan akun GSIC Hub Anda.",
    title: "Verifikasi alamat email Anda",
    body: `Halo${name ? ` ${esc(name)}` : ""}, terima kasih telah mendaftar di GSIC Hub. Klik tombol di bawah untuk memverifikasi email dan mengaktifkan akun Anda.`,
    cta: "Verifikasi Email",
    expiry: "Tautan berlaku sementara dan hanya dapat digunakan sekali.",
    ignore: "Jika Anda tidak merasa mendaftar di GSIC Hub, abaikan email ini.",
  }),
  magic: (name) => ({
    subject: "Tautan masuk GSIC Hub",
    preheader: "Klik untuk masuk ke GSIC Hub tanpa kata sandi.",
    title: "Masuk ke GSIC Hub",
    body: `Halo${name ? ` ${esc(name)}` : ""}, gunakan tombol di bawah untuk masuk ke akun Anda tanpa kata sandi.`,
    cta: "Masuk ke GSIC Hub",
    expiry: "Tautan berlaku sementara (umumnya 1 jam) dan hanya dapat digunakan sekali.",
    ignore: "Jika Anda tidak meminta tautan ini, abaikan email ini — akun Anda tetap aman.",
  }),
  reset: (name) => ({
    subject: "Atur ulang kata sandi GSIC Hub",
    preheader: "Permintaan pengaturan ulang kata sandi untuk akun GSIC Hub Anda.",
    title: "Atur ulang kata sandi",
    body: `Halo${name ? ` ${esc(name)}` : ""}, kami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Klik tombol di bawah untuk membuat kata sandi baru.`,
    cta: "Buat Kata Sandi Baru",
    expiry: "Tautan berlaku sementara (umumnya 1 jam) dan hanya dapat digunakan sekali.",
    ignore: "Jika Anda tidak meminta ini, abaikan email ini — kata sandi Anda tidak akan berubah.",
  }),
};

export interface RenderedEmail { subject: string; html: string; text: string }

export function renderActionEmail(kind: EmailKind, opts: { url: string; name?: string; siteUrl: string }): RenderedEmail {
  const c = COPY[kind](opts.name);
  const url = esc(opts.url);
  const logo = `${opts.siteUrl}/favicon.png`;

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;padding:32px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;padding-right:10px;"><img src="${esc(logo)}" width="32" height="32" alt="GSIC" style="display:block;border:0;border-radius:8px;background:${BRAND};"></td>
        <td style="vertical-align:middle;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:700;color:${INK};letter-spacing:-0.2px;">GSIC <span style="font-weight:500;color:${MUTED};">Hub</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#FFFFFF;border:1px solid ${BORDER};border-top:4px solid #5CE3B6;border-radius:12px;padding:36px 32px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;color:${INK};letter-spacing:-0.3px;">${esc(c.title)}</h1>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${MUTED};">${c.body}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;"><tr>
        <td align="center" bgcolor="${BRAND}" style="border-radius:8px;">
          <a href="${url}" target="_blank" rel="noopener" style="display:inline-block;padding:13px 28px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">${esc(c.cta)}</a>
        </td>
      </tr></table>
      <p style="margin:0 0 6px;font-size:13px;line-height:1.5;color:${MUTED};">${esc(c.expiry)}</p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:${MUTED};">${esc(c.ignore)}</p>
      <div style="height:1px;background:${BORDER};margin:0 0 18px;"></div>
      <p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:#64748B;">Tombol tidak berfungsi? Salin dan tempel tautan ini ke browser:</p>
      <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${url}" style="color:${BRAND};text-decoration:underline;">${url}</a></p>
    </td></tr>
    <tr><td style="padding:20px 8px 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#64748B;text-align:center;">
      © ${new Date().getFullYear()} GSIC — Ganesha Students Innovation Center · KM ITB<br>Email otomatis, mohon tidak membalas pesan ini.
    </td></tr>
  </table>
</td></tr></table></body></html>`;

  const text = [c.title, "", c.body.replace(/&[a-z#0-9]+;/g, ""), "", `${c.cta}: ${opts.url}`, "", c.expiry, c.ignore, "", "— GSIC Hub · KM ITB"].join("\n");
  return { subject: c.subject, html, text };
}
