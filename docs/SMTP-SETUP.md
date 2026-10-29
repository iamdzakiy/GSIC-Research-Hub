# Email setup (GSIC SMTP)

GSIC Hub sends its own emails through the GSIC mailbox with nodemailer (`lib/mailer.ts`):

- **Welcome email** after sign-up. Accounts are created already confirmed, so there is no verification step. A failed welcome email is logged and never blocks sign-up.
- **Magic link** and **password reset** emails.

Supabase only generates the one-time links. It does not send these emails.

## Environment variables

Set these in `.env.local` and in Vercel (Settings, Environment Variables). See `.env.example`.

```bash
SMTP_HOST=smtp.example.org
SMTP_PORT=587
SMTP_USER=no-reply@example.org
SMTP_PASSWORD=<app password>
SMTP_FROM="GSIC Hub <no-reply@example.org>"
SMTP_SECURE=false          # optional; defaults to true on port 465
NEXT_PUBLIC_SITE_URL=https://<your-site>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server only
```

Gmail needs 2-Step Verification and an App Password.

## Supabase settings

- **Authentication, URL Configuration**: Site URL `https://<your-site>`, and add `https://<your-site>/auth/callback` to Redirect URLs.
- **Authentication, Providers, Email**: "Confirm email" no longer matters. The register API confirms accounts itself.

## Check it

1. `npm run doctor` reports env, database, Supabase service role and SMTP login.
2. `npm run dev`, create an account, and confirm you land on `/dashboard` and receive the welcome email.
