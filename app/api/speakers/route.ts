import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

export async function GET() {
  const speakers = await prisma.speaker.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(speakers);
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.name || !body.roleTitle || !body.institution || !body.avatarUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const speaker = await prisma.speaker.create({
    data: {
      name: body.name,
      roleTitle: body.roleTitle,
      institution: body.institution,
      avatarUrl: body.avatarUrl,
      bio: body.bio || null,
      linkedinUrl: body.linkedinUrl || null,
      order: body.order || 0,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json(speaker, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const updated = await prisma.speaker.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.speaker.delete({ where: { id } });
  return NextResponse.json({ success: true });
}