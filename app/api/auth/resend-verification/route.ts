import { NextResponse } from "next/server";
import { emailOnlySchema } from "@/lib/validation/auth";
import { guard, mapServerError } from "@/lib/auth-route";
import { issueAndSendLink } from "@/lib/auth-mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = await guard(req, "resend-verification", emailOnlySchema);
  if (!g.ok) return g.res;
  try {
    await issueAndSendLink(req, { kind: "verify", email: g.data.email, resend: true });
    return NextResponse.json({ ok: true, message: "If this account is waiting for verification, a new link has been sent." });
  } catch (e) {
    return mapServerError(e);
  }
}
