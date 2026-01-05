import { NextResponse } from "next/server";
import { endOfWeek } from "date-fns";
import { prisma } from "@/lib/db";
import { getWeekLabel } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";

export async function POST() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: "No autorizado. Por favor inicia sesión." },
      { status: 401 }
    );
  }

  let profile = await prisma.vendorProfile.findUnique({
    where: { userId: session.dbUser.id },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Perfil de vendedor no encontrado" },
      { status: 403 }
    );
  }

  try {
    const weekLabel = getWeekLabel();

    const existing = await prisma.catalogShareLink.findFirst({
      where: { vendorId: profile.id, weekLabel },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const expiresAt = endOfWeek(new Date(), { weekStartsOn: 1 });
    const slug = `${profile.slug}-${weekLabel}`;

    const link = await prisma.catalogShareLink.create({
      data: {
        vendorId: profile.id,
        slug,
        weekLabel,
        expiresAt,
      },
    });

    return NextResponse.json({ ...link, vendorSlug: profile.slug }, { status: 201 });
  } catch (error) {
    console.error("Error creating catalog share link:", error);
    return NextResponse.json(
      { error: "No se pudo crear el enlace de compartir" },
      { status: 500 }
    );
  }
}

