import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth-helper";

/**
 * Wraps an API route handler with consistent error handling.
 *  - AuthError           -> its own status (401/403)
 *  - Prisma P2025        -> 404
 *  - Prisma P2002        -> 409 (unique constraint)
 *  - Prisma P2021/P2022  -> 503 "database schema out of date" (table/column missing: run `npx prisma db push`)
 *  - Prisma init/connect -> 503 "database unreachable"
 *  - anything else       -> 500 with a short reference code (full error is logged server-side)
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (e: unknown) {
      if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });

      const err = e as { code?: string; name?: string; message?: string; meta?: { column?: string; table?: string } };
      const ref = Math.random().toString(36).slice(2, 8);
      const dev = process.env.NODE_ENV !== "production";

      if (err?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (err?.code === "P2002") return NextResponse.json({ error: "Data sudah ada (duplikat)." }, { status: 409 });
      if (err?.code === "P2021" || err?.code === "P2022") {
        console.error(`[API ${ref}] DB schema out of date`, err.code, err.meta);
        return NextResponse.json(
          { error: "Skema database belum diperbarui. Jalankan `npx prisma db push` lalu muat ulang.", code: err.code, ref, ...(dev ? { detail: err.meta } : {}) },
          { status: 503 }
        );
      }
      if (err?.name === "PrismaClientInitializationError" || err?.code === "ECONNREFUSED" || err?.code === "P1001" || err?.code === "P1002") {
        console.error(`[API ${ref}] DB unreachable`, err.message);
        return NextResponse.json({ error: "Database tidak dapat dihubungi. Periksa DATABASE_URL.", ref }, { status: 503 });
      }

      console.error(`[API ${ref}] Unhandled`, e);
      return NextResponse.json({ error: "Internal server error", ref, ...(dev ? { detail: err?.message } : {}) }, { status: 500 });
    }
  };
}

/**
 * Parses `page` and `pageSize` query params into Prisma pagination args.
 * Returns `{ skip, take }` with safe defaults (page=1, pageSize=20, max 100).
 */
export function parsePagination(url: string | URL): { skip: number; take: number } {
  const u = typeof url === "string" ? new URL(url) : url;
  const page = Math.max(1, parseInt(u.searchParams.get("page") || "1", 10) || 1);
  const pageSizeRaw = parseInt(u.searchParams.get("pageSize") || "20", 10) || 20;
  const pageSize = Math.min(Math.max(1, pageSizeRaw), 100);
  return { skip: (page - 1) * pageSize, take: pageSize };
}
