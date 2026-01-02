import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireVendorProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

export async function GET() {
  const { profile } = await requireVendorProfile();

  const [productsCount, pendingEvents, salesAgg] = await Promise.all([
    prisma.product.count({ where: { vendorId: profile.id } }),
    prisma.productEvent.count({
      where: { vendorId: profile.id, status: "pending" },
    }),
    prisma.productSale.aggregate({
      where: { vendorId: profile.id },
      _sum: { amount: true, quantity: true },
    }),
  ]);

  const stats = [
    { label: "Productos", value: productsCount },
    { label: "Eventos pendientes", value: pendingEvents },
    { label: "Ventas", value: salesAgg._sum.quantity ?? 0 },
    {
      label: "Ingresos",
      value: formatCurrency(Number(salesAgg._sum.amount ?? 0)),
    },
  ];

  return NextResponse.json(stats);
}

