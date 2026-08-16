import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newEvent = await prisma.event.create({
    data: {
      ...body,
    },
  });
  return NextResponse.json(newEvent, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...data,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}