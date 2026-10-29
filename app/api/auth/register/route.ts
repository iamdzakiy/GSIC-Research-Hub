import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { profileToData } from "@/lib/validation/profile";
import { fail, guard, mapServerError } from "@/lib/auth-route";
import { siteUrl, supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderWelcomeEmail } from "@/lib/email-templates";
import { sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ALREADY = "This email is already registered. Sign in or reset your password.";
const MAIL_TIMEOUT_MS = 8_000;

/** Welcome email: bounded wait, never throws. A mail problem must not fail registration. */
async function sendWelcome(to: string, name: string, site: string) {
  try {
    await Promise.race([
      sendMail({ to, ...renderWelcomeEmail({ name, siteUrl: site }) }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), MAIL_TIMEOUT_MS)),
    ]);
  } catch (e) {
    console.error("[register] welcome email failed:", (e as Error).message);
  }
}

export async function POST(req: Request) {
  const g = await guard(req, "register", registerSchema);
  if (!g.ok) return g.res;
  const { name, email, password, ...profile } = g.data;
  const admin = supabaseAdmin();
  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, ...profile },
    });
    if (error || !data.user) {
      if (error && (error.status === 422 || /already|exists|registered/i.test(error.message))) {
        return fail(409, ALREADY, { fieldErrors: { email: ALREADY } });
      }
      throw error ?? new Error("Supabase did not return a user");
    }

    try {
      const fields = profileToData(profile);
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: { ...fields, name, email, emailConfirmed: true },
        create: {
          id: data.user.id,
          email,
          name,
          htaId: `HTA-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          ...fields,
          emailConfirmed: true,
          role: "user",
          provider: "email",
        },
      });
    } catch (e) {
      await admin.auth.admin.deleteUser(data.user.id).catch((d) => console.error("[register] rollback failed:", d));
      throw e;
    }

    await sendWelcome(email, name, siteUrl(req));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return mapServerError(e);
  }
}
