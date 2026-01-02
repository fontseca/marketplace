import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { normalizePhoneNumber, validatePhoneNumber } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { dbUser } = await requireSessionUser();

    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Número de teléfono requerido" }, { status: 400 });
    }

    const normalized = normalizePhoneNumber(phone);
    if (!validatePhoneNumber(normalized)) {
      return NextResponse.json(
        { error: "Número de teléfono inválido (mínimo 10 dígitos)" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { phone: normalized },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes("No autorizado") || error.message?.includes("redirect")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Error updating phone:", error);
    return NextResponse.json(
      { error: "Error al actualizar el número de teléfono" },
      { status: 500 },
    );
  }
}

