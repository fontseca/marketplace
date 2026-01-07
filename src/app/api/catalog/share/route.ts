import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { vendorSlug } = body;

  let profile;

  if (vendorSlug) {
    // If vendor slug is provided, use that vendor (no auth required)
    profile = await prisma.vendorProfile.findUnique({
      where: { slug: vendorSlug },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Vendedor no encontrado" },
        { status: 404 }
      );
    }
  } else {
    // If no vendor slug, use logged-in user (requires auth)
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: "No autorizado. Por favor inicia sesión." },
      { status: 401 }
    );
  }

    profile = await prisma.vendorProfile.findUnique({
    where: { userId: session.dbUser.id },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Perfil de vendedor no encontrado" },
      { status: 403 }
    );
    }
  }

  try {
    // Check if a share link already exists for this vendor
    const existing = await prisma.catalogShareLink.findFirst({
      where: { vendorId: profile.id },
    });

    // Create a simple slug without week
    let slug = `${profile.slug}-catalog`;
    let attempts = 0;
    const maxAttempts = 5;
    
    // Check if slug is available or belongs to this vendor
    while (attempts < maxAttempts) {
      const existingSlug = await prisma.catalogShareLink.findUnique({
        where: { slug },
    });
      
      if (!existingSlug) {
        break; // Slug is available
      }
      
      // If slug exists and belongs to this vendor, we'll update it
      if (existingSlug.vendorId === profile.id) {
        break;
    }

      // Otherwise, try with a random suffix
      slug = `${profile.slug}-catalog-${Math.random().toString(36).slice(2, 7)}`;
      attempts++;
    }
    
    // Set expiration far in the future (10 years) since we're not using weeks
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 10);

    let link;
    
    if (existing) {
      // Update existing link to use new format (remove week from slug if present)
      link = await prisma.catalogShareLink.update({
        where: { id: existing.id },
        data: {
          slug,
          weekLabel: "all", // Placeholder value, not used anymore
          expiresAt,
        },
      });
    } else {
      // Create new link
      link = await prisma.catalogShareLink.create({
      data: {
        vendorId: profile.id,
        slug,
          weekLabel: "all", // Placeholder value, not used anymore
        expiresAt,
      },
    });
    }

    return NextResponse.json({ ...link, vendorSlug: profile.slug }, { status: existing ? 200 : 201 });
  } catch (error: any) {
    // Handle unique constraint error (slug already exists)
    if (error.code === "P2002") {
      // Try to find existing link
      const existing = await prisma.catalogShareLink.findFirst({
        where: { vendorId: profile.id },
      });
      if (existing) {
        return NextResponse.json(existing);
      }
    }
    
    console.error("Error creating catalog share link:", error);
    return NextResponse.json(
      { error: "No se pudo crear el enlace de compartir" },
      { status: 500 }
    );
  }
}

