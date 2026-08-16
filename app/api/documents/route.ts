import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const documents = await prisma.document.findMany({
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newDocument = await prisma.document.create({
    data: {
      ...body,
    },
  });
  return NextResponse.json(newDocument, { status: 201 });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}