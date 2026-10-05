import { NextResponse } from "next/server";
import { emailOnlySchema } from "@/lib/validation/auth";
import { guard, mapServerError } from "@/lib/auth-route";
import { issueAndSendLink } from "@/lib/auth-mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = await guard(req, "forgot-password", emailOnlySchema);
  if (!g.ok) return g.res;
  try {
    await issueAndSendLink(req, { kind: "reset", email: g.data.email });
    return NextResponse.json({ ok: true, message: "Jika email terdaftar, tautan atur ulang kata sandi telah dikirim." });
  } catch (e) {
    return mapServerError(e);
  }
}
