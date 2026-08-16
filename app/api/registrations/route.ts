import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const registrations = await prisma.registration.findMany({
    orderBy: { registeredAt: "desc" },
  });
  return NextResponse.json(registrations);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newRegistration = await prisma.registration.create({
    data: {
      ...body,
    },
  });
  return NextResponse.json(newRegistration, { status: 201 });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.registration.delete({ where: { id } });
  return NextResponse.json({ success: true });
}