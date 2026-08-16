import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

export async function GET() {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { deadline: "asc" },
  });
  return NextResponse.json(opportunities);
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Optionally check if user is admin via DB

  const body = await request.json();
  // Validate required fields
  if (!body.title || !body.type || !body.organizer || !body.deadline) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const newOpp = await prisma.opportunity.create({
    data: {
      ...body,
      deadline: new Date(body.deadline),
    },
  });
  return NextResponse.json(newOpp, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.opportunity.update({
    where: { id },
    data: {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.opportunity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}