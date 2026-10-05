import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Deployment self-check. Public, but returns ONLY booleans and table/column NAMES (no secrets, no row data).
 * Open /api/health after deploying: every value should be true.
 */
export async function GET() {
  const env = Object.fromEntries(
    ["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SITE_URL", "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"].map((k) => [k, !!process.env[k]])
  );
  const checks: Record<string, boolean | string> = {};
  const probe = async (name: string, fn: () => Promise<unknown>) => {
    try { await fn(); checks[name] = true; } catch (e) { checks[name] = (e as { code?: string }).code ?? "error"; }
  };
  await probe("db_connect", () => prisma.$queryRaw`SELECT 1`);
  await probe("opportunity_new_columns", () => prisma.opportunity.findFirst({ select: { openDate: true, fundingType: true, quickFacts: true } }));
  await probe("table_ResourceLink", () => prisma.resourceLink.count());
  await probe("table_GalleryItem", () => prisma.galleryItem.count());
  await probe("auth_users_readable", () => prisma.$queryRaw`SELECT 1 FROM auth.users LIMIT 1`);
  const ok = checks.db_connect === true && Object.values(checks).every((v) => v === true);
  return NextResponse.json({ ok, checks, env, hint: ok ? undefined : "Any value other than true is a problem. P2021 or P2022: run `npx prisma db push`." }, { status: ok ? 200 : 503 });
}
