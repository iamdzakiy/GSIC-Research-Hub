import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tests = await prisma.test.findMany({
    orderBy: { id: "desc" },
  });
  return NextResponse.json(tests);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newTest = await prisma.test.create({
    data: {
      ...body,
    },
  });
  return NextResponse.json(newTest, { status: 201 });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.test.delete({ where: { id } });
  return NextResponse.json({ success: true });
}