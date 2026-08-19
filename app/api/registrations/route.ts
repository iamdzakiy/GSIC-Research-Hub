import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

export async function GET() {
  const registrations = await prisma.registration.findMany({
    orderBy: { registeredAt: "desc" },
  });
  return NextResponse.json(registrations);
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const newRegistration = await prisma.registration.create({
    data: {
      userId: body.userId || user.id,
      eventId: body.eventId,
      status: body.status || "confirmed",
      preTestCompleted: body.preTestCompleted || false,
      postTestCompleted: body.postTestCompleted || false,
    },
  });
  return NextResponse.json(newRegistration, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.registration.update({
    where: { id },
    data: {
      ...data,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.registration.delete({ where: { id } });
  return NextResponse.json({ success: true });
}