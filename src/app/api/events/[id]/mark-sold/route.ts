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
    include: { product: true },
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

  // Verificar que el producto tenga stock
  if (event.product.stock <= 0) {
    return NextResponse.json(
      { error: "El producto no tiene stock disponible" },
      { status: 400 },
    );
  }

  // Usar transacción para asegurar consistencia
  await prisma.$transaction(async (tx) => {
    // Decrementar stock del producto
    await tx.product.update({
      where: { id: event.productId },
      data: {
        stock: { decrement: 1 },
        salesCount: { increment: 1 },
      },
    });

    // Crear registro de venta
    await tx.productSale.create({
      data: {
        productId: event.productId,
        vendorId: event.vendorId,
        quantity: 1,
        amount: event.product.salePrice ?? event.product.regularPrice,
      },
    });

    // Marcar evento como resuelto
    await tx.productEvent.update({
      where: { id: event.id },
      data: { status: "resolved", resolvedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true });
}

