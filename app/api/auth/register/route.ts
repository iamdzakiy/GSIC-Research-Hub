import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { profileToData } from "@/lib/validation/profile";
import { fail, guard, mapServerError } from "@/lib/auth-route";
import { siteUrl, supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderWelcomeEmail } from "@/lib/email-templates";
import { trySendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { syncProfileToSheet } from "@/lib/matchmaking-sheet";

export const runtime = "nodejs";

const ALREADY = "This email is already registered. Sign in or reset your password.";
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

    await syncProfileToSheet(data.user.id);
    await trySendMail({ to: email, ...renderWelcomeEmail({ name, siteUrl: siteUrl(req) }) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return mapServerError(e);
  }
}
