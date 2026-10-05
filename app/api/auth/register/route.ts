import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { guard, mapServerError } from "@/lib/auth-route";
import { issueAndSendLink } from "@/lib/auth-mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = await guard(req, "register", registerSchema);
  if (!g.ok) return g.res;
  try {
    const { name, email, password, ...profile } = g.data;
    await issueAndSendLink(req, { kind: "verify", email, name, password, profile });
    return NextResponse.json({ ok: true, message: "If this address can be registered, a verification link is on its way. Check your inbox and spam folder." });
  } catch (e) {
    return mapServerError(e);
  }
}
