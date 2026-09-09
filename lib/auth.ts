// ============================================================
// Unified auth + error-handling helpers.
//
// This module is the canonical entry point for server-side auth guards and the
// standardized error wrapper. It re-exports the low-level implementations which
// live in `auth-helper.ts` and `api-utils.ts`, and adds `getCurrentUser`.
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin, requireUser, AuthError } from "@/lib/auth-helper";
import { withErrorHandler, parsePagination } from "@/lib/api-utils";

export { requireAdmin, requireUser, AuthError, withErrorHandler, parsePagination };

/**
 * Returns the authenticated user's Prisma record (scalar fields only, no
 * relations) or `null` when the request is not authenticated.
 */
export async function getCurrentUser(request: Request) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) return null;
  return prisma.user.findUnique({ where: { id: authUser.id } });
}

// Re-export the response convenience helpers from Next for callers that prefer
// to import everything from this single module.
export { NextResponse } from "next/server";