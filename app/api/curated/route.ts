import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

export async function GET() {
  const curated = await prisma.curatedOpportunity.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(curated);
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.title || !body.type || !body.organizer || !body.monthOpen) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const newCurated = await prisma.curatedOpportunity.create({
    data: {
      title: body.title,
      type: body.type,
      organizer: body.organizer,
      monthOpen: body.monthOpen,
      description: body.description || "",
      link: body.link || "",
    },
  });
  return NextResponse.json(newCurated, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.curatedOpportunity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}