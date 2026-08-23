# Setting Up Custom SMTP for Supabase Email Verification

GSIC Hub uses Supabase Auth for email/password sign-up. By default, Supabase uses its built-in email service which has **rate limits** and can occasionally fail to deliver verification emails. To guarantee reliable delivery, configure a **custom SMTP provider**.

---

## Option A — Resend (Recommended)

1. Create a free account at [resend.com](https://resend.com).
2. Add and verify a domain (e.g. `gsic.ganesha.edu`).
3. Create an **API Key** (Settings → API Keys) with `sending` permission.
4. In the **Supabase Dashboard**:
   - Go to **Authentication → SMTP Settings**.
   - Toggle **Enable Custom SMTP**.
   - Fill in:
     - **Host**: `smtp.resend.com`
     - **Port**: `465`
     - **Username**: `resend`
     - **Password**: your Resend API key
     - **Sender email**: `GSIC Hub <no-reply@gsic.ganesha.edu>`
     - **Sender name**: `GSIC Hub`
5. Click **Save**.

## Option B — SendGrid

1. Create a SendGrid account and verify a sender domain.
2. Create an **API Key** (Settings → API Keys) with `Mail Send` permission.
3. In **Supabase Dashboard → Authentication → SMTP Settings**:
   - **Host**: `smtp.sendgrid.net`
   - **Port**: `465`
   - **Username**: `apikey`
   - **Password**: your SendGrid API key
   - **Sender email**: `GSIC Hub <no-reply@gsic.ganesha.edu>`
4. Save.

## Option C — Gmail SMTP (for quick testing only)

> ⚠️ Gmail blocks "less secure apps". Use an **App Password** (requires 2FA enabled).

1. Enable 2-Step Verification on your Google account.
2. Generate an **App Password** (Google Account → Security → App passwords).
3. In **Supabase Dashboard → Authentication → SMTP Settings**:
   - **Host**: `smtp.gmail.com`
   - **Port**: `465`
   - **Username**: your full Gmail address
   - **Password**: the 16-char App Password
   - **Sender email**: your Gmail address
4. Save.

---

## Customize the Email Template

1. In **Supabase Dashboard → Authentication → Emails → Templates**.
2. Select **Confirm signup**.
3. Paste the ready-made dark template from [`docs/email-template.html`](./email-template.html) into the message body (switch the editor to source/HTML mode). The confirmation link is auto-injected via `{{ .ConfirmationURL }}`.
4. Suggested subject: `Confirm your email — GSIC Research Hub ✨`
5. Ensure the **Redirect URL** matches your app (e.g. `http://localhost:3000/auth` in dev, `https://your-domain.com/auth` in prod).

---

## Required Environment Variables

Add these to `.env.local` (dev) and your hosting provider's env settings (production):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Site URL — used for email confirmation redirects and password reset links.
# In production this MUST be your deployed URL, otherwise confirmation emails
# will redirect users to localhost.
NEXT_PUBLIC_SITE_URL=http://localhost:3000        # dev
# NEXT_PUBLIC_SITE_URL=https://gsic-research-hub.vercel.app   # production

# Dev fallback: skip "check your email" step when Confirm email is OFF
NEXT_PUBLIC_DEV_AUTO_CONFIRM=1                    # dev only

# Hero "Watch Teaser" video (YouTube or Instagram link)
NEXT_PUBLIC_TEASER_VIDEO_URL=https://www.youtube.com/watch?v=YOUR_VIDEO_ID

# Optional: server-side admin script (scripts/create-admin-account.ts)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>      # keep secret, never NEXT_PUBLIC_
ADMIN_EMAIL=admin@gsic.km.itb.ac.id
ADMIN_PASSWORD=your-secure-password
```

Also add your production URL to **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**, e.g. `https://your-domain.com/auth`.

---

## Development Fallback (Skip Email Verification)

For local development you can **disable email confirmation** so users are auto-confirmed and can sign in immediately:

1. In **Supabase Dashboard → Authentication → Providers → Email**.
2. Toggle **Confirm email** **OFF**.
3. Save.

**OR** set this env var in your `.env.local` to hint the UI to skip the "check your email" step:

```
NEXT_PUBLIC_DEV_AUTO_CONFIRM=1
```

> ⚠️ Never disable "Confirm email" in production.

---

## Verify It Works

1. Run `npm run dev`.
2. Sign up with a test email.
3. Check the inbox (or Resend/SendGrid logs) for the confirmation email.
4. Click the link — you should be redirected to `/auth` and be able to sign in.