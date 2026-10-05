# Supabase email templates

The app sends its own sign-up, magic-link and reset emails through the GSIC mailbox (SMTP), using `lib/email-templates.ts`. These HTML files are the same designs for the emails Supabase itself may still send (for example if SMTP is not set up, or for invites and email changes).

Paste each file into **Supabase Dashboard → Authentication → Email Templates**:

| Supabase template | File | Suggested subject |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | Confirm your GSIC Hub account |
| Magic Link | `magic-link.html` | Your GSIC Hub sign-in link |
| Reset Password | `reset-password.html` | Reset your GSIC Hub password |

Also set **Authentication → URL Configuration**: Site URL `https://<your-site>` and the redirect `https://<your-site>/auth/callback**`.

The files are generated. After editing `lib/email-templates.ts`, run `npx tsx scripts/build-email-templates.ts`.
