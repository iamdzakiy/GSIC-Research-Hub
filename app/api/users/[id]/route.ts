import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helper";
import { withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const requester = await requireUser(request);

    // Only allow a user to fetch their own profile unless the requester is an admin
    if (requester.role !== "admin" && requester.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  }
);