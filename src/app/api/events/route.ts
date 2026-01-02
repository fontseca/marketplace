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

  // Get current user to access their phone number
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Check if user has phone number
  if (!session.dbUser.phone) {
    return NextResponse.json(
      { error: "Por favor completa tu perfil con tu número de teléfono" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, vendorId: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  // Use buyer's phone from user record if not provided in request
  const buyerContact = parsed.data.buyerContact || session.dbUser.phone;

  await prisma.productEvent.create({
    data: {
      productId: product.id,
      vendorId: product.vendorId,
      status: "pending",
      type: "purchase_intent",
      buyerName: parsed.data.buyerName,
      buyerContact,
      note: parsed.data.note,
    },
  });

  return NextResponse.json({ ok: true, buyerPhone: session.dbUser.phone });
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

