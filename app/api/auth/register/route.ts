import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { guard, mapServerError } from "@/lib/auth-route";
import { issueAndSendLink } from "@/lib/auth-mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = await guard(req, "register", registerSchema);
  if (!g.ok) return g.res;
  try {
    await issueAndSendLink(req, { kind: "verify", email: g.data.email, name: g.data.name, password: g.data.password });
    return NextResponse.json({ ok: true, message: "Jika email ini dapat didaftarkan, tautan verifikasi telah dikirim. Periksa kotak masuk dan folder spam." });
  } catch (e) {
    return mapServerError(e);
  }
}
