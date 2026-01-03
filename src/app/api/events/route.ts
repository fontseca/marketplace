import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { eventCreateSchema } from "@/lib/validators";
import { getSessionUser, requireVendorProfile } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = eventCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  // Get current user if authenticated (optional)
  const session = await getSessionUser();

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, vendorId: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  // Use buyer's phone from user record if authenticated, otherwise use provided contact
  const buyerContact = parsed.data.buyerContact || (session?.dbUser.phone ?? null);
  const userId = session?.dbUser.id ?? null;

  await prisma.productEvent.create({
    data: {
      productId: product.id,
      vendorId: product.vendorId,
      userId,
      status: "pending",
      type: "purchase_intent",
      buyerName: parsed.data.buyerName,
      buyerContact,
      note: parsed.data.note,
    },
  });

  return NextResponse.json({ ok: true, buyerPhone: buyerContact });
}

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isRoot = session.dbUser.role.name === "root";
  const status = new URL(request.url).searchParams.get("status") ?? undefined;

  let vendorId: string | undefined;
  if (!isRoot) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.dbUser.id },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Perfil de vendedor no encontrado" }, { status: 403 });
    }
    vendorId = vendor.id;
  } else {
    vendorId = new URL(request.url).searchParams.get("vendorId") ?? undefined;
  }

  const events = await prisma.productEvent.findMany({
    where: {
      vendorId,
      status: status ? (status as any) : undefined,
    },
    include: {
      product: {
        select: { id: true, name: true, slug: true, stock: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(events);
}

