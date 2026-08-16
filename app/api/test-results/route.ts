import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const testResults = await prisma.testResult.findMany({
    orderBy: { completedAt: "desc" },
  });
  return NextResponse.json(testResults);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newTestResult = await prisma.testResult.create({
    data: {
      ...body,
    },
  });
  return NextResponse.json(newTestResult, { status: 201 });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.testResult.delete({ where: { id } });
  return NextResponse.json({ success: true });
}