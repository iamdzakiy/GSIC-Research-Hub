import { createClient, User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export async function getUserFromRequest(request: Request): Promise<User | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Extracts the authenticated user from the request, fetches their role from the
 * database (Prisma `User` model), and throws an `AuthError` (401/403) if the
 * requester is not authenticated or is not an admin.
 *
 * @returns the requesting user's Prisma record (must be an admin).
 */
export async function requireAdmin(request: Request) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) {
    throw new AuthError("Unauthorized", 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
  });
  if (!dbUser) {
    throw new AuthError("Unauthorized", 401);
  }
  if (dbUser.role !== "admin") {
    throw new AuthError("Forbidden", 403);
  }

  return dbUser;
}

/**
 * Extracts the authenticated user from the request and fetches their Prisma
 * record. Throws an `AuthError` (401) if not authenticated.
 */
export async function requireUser(request: Request) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) {
    throw new AuthError("Unauthorized", 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
  });
  if (!dbUser) {
    throw new AuthError("Unauthorized", 401);
  }

  return dbUser;
}