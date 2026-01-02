import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  const event = await prisma.productEvent.findUnique({
    where: { id },
  });

  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

  const isRoot = session.dbUser.role.name === "root";
  if (!isRoot) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.dbUser.id },
    });
    if (!vendor || vendor.id !== event.vendorId) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
  }

  await prisma.productEvent.update({
    where: { id: event.id },
    data: { status: "discarded", resolvedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

