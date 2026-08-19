import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

// Create a new user profile
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  try {
    const newUser = await prisma.user.upsert({
      where: { id: body.id || user.id },
      update: {
        name: body.name,
        email: body.email,
        faculty: body.faculty,
        major: body.major,
        year: body.year ? parseInt(body.year) : undefined,
        whatsapp: body.whatsapp,
        avatarUrl: body.avatarUrl,
        classcardTheme: body.classcardTheme || "blue",
        skills: body.skills || [],
        bio: body.bio,
        isVerified: body.isVerified || false,
        role: body.role || "user",
      },
      create: {
        id: body.id || user.id,
        name: body.name,
        email: body.email,
        faculty: body.faculty,
        major: body.major,
        year: body.year ? parseInt(body.year) : undefined,
        whatsapp: body.whatsapp,
        avatarUrl: body.avatarUrl,
        classcardTheme: body.classcardTheme || "blue",
        skills: body.skills || [],
        bio: body.bio,
        isVerified: body.isVerified || false,
        role: body.role || "user",
      },
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// Update a user profile
export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = body.id || user.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        faculty: body.faculty,
        major: body.major,
        year: body.year !== undefined ? parseInt(body.year) : undefined,
        whatsapp: body.whatsapp,
        avatarUrl: body.avatarUrl,
        classcardTheme: body.classcardTheme,
        skills: body.skills,
        bio: body.bio,
        isVerified: body.isVerified,
        role: body.role,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}