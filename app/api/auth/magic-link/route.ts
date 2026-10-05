import { NextResponse } from "next/server";
import { emailOnlySchema } from "@/lib/validation/auth";
import { guard, mapServerError } from "@/lib/auth-route";
import { issueAndSendLink } from "@/lib/auth-mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = await guard(req, "magic-link", emailOnlySchema);
  if (!g.ok) return g.res;
  try {
    await issueAndSendLink(req, { kind: "magic", email: g.data.email });
    return NextResponse.json({ ok: true, message: "If this email is registered, a sign-in link has been sent. Check your inbox and spam folder." });
  } catch (e) {
    return mapServerError(e);
  }
}
