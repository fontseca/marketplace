import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saleSchema } from "@/lib/validators";
import { requireVendorProfile } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { profile } = await requireVendorProfile();
  const { id } = await params;
  const body = await request.json();
  const parsed = saleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.vendorId !== profile.id) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const quantity = parsed.data.quantity ?? 1;
  const amount = parsed.data.amount ?? undefined;

  const newStock = Math.max(0, (product.stock ?? 0) - quantity);

  await prisma.$transaction([
    prisma.product.update({
      where: { id: product.id },
      data: {
        stock: newStock,
        salesCount: { increment: quantity },
      },
    }),
    prisma.productSale.create({
      data: {
        productId: product.id,
        vendorId: profile.id,
        quantity,
        amount,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

