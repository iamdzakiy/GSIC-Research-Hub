import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth-helper";

/**
 * Higher-order function that wraps an API route handler with a consistent
 * try/catch. AuthErrors map to their HTTP status; Prisma "not found" errors map
 * to 404; all other errors are logged and mapped to a generic 500 response.
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (e: unknown) {
      if (e instanceof AuthError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }

      // Prisma "not found" errors have code 'P2025' on the error object.
      const err = e as { code?: string };
      if (err?.code === "P2025") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      console.error("[API Error]", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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