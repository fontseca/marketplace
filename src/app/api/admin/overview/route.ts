import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRootUser } from "@/lib/auth";

export async function GET() {
  await requireRootUser();

  const [users, vendors, products, events] = await Promise.all([
    prisma.user.count(),
    prisma.vendorProfile.count(),
    prisma.product.count(),
    prisma.productEvent.count(),
  ]);

  return NextResponse.json({
    users,
    vendors,
    products,
    events,
  });
}

