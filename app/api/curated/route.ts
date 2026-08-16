import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const adminAccounts = await prisma.adminAccount.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(adminAccounts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newAdmin = await prisma.adminAccount.create({
    data: {
      ...body,
    },
  });
  return NextResponse.json(newAdmin, { status: 201 });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.adminAccount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}