import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema, productImageSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { getSessionUser, requireVendorProfile } from "@/lib/auth";
import { deleteS3Object } from "@/lib/s3";
import { z } from "zod";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const vendorIdParam = url.searchParams.get("vendorId") ?? undefined;
  const isRoot = session.dbUser.role.name === "root";

  let vendorId = vendorIdParam;
  if (!isRoot) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.dbUser.id },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Perfil de vendedor no encontrado" }, { status: 403 });
    }
    vendorId = vendor.id;
  }

  const products = await prisma.product.findMany({
    where: {
      vendorId: vendorId ?? undefined,
      status: status ? (status as any) : undefined,
    },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
      vendor: { select: { displayName: true, slug: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const { profile } = await requireVendorProfile();
  const body = await request.json();

  // Create a modified schema that allows empty images array for initial creation
  // Images will be added after product is created and images are uploaded to S3
  const createProductSchema = productSchema.extend({
    images: z.array(productImageSchema).default([]), // Allow empty array for initial creation
  });

  // Validate product data first - before any database operations
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;

  // Additional validation: ensure images array exists and is valid
  // Note: Images can be empty initially - they will be added after product creation
  if (!Array.isArray(data.images)) {
    return NextResponse.json({ error: "Las imágenes deben ser un array" }, { status: 400 });
  }

  // Validate category exists if provided
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 400 });
    }
  }

  const baseSlug = slugify(data.name);
  const slugCount = await prisma.product.count({
    where: { slug: baseSlug },
  });

  let brandId: string | null = null;
  if (data.brandName && data.brandName.trim().length > 0) {
    const brandSlug = slugify(data.brandName);
    const brand = await prisma.brand.upsert({
      where: { vendorId_slug: { vendorId: profile.id, slug: brandSlug } },
      update: { name: data.brandName },
      create: { vendorId: profile.id, name: data.brandName, slug: brandSlug },
    });
    brandId = brand.id;
  }

  // STEP 1: Create product in database FIRST (without images)
  // Images will be added after product is successfully created
  let product;
  try {
    product = await prisma.product.create({
      data: {
        vendorId: profile.id,
        name: data.name,
        slug: slugCount > 0 ? `${baseSlug}-${slugCount + 1}` : baseSlug,
        description: data.description || "",
        brandId,
        brandName: data.brandName ?? null,
        categoryId: data.categoryId || null,
        regularPrice: data.regularPrice,
        salePrice: data.salePrice ?? null,
        saleExpiresAt: data.saleExpiresAt ? new Date(data.saleExpiresAt) : null,
        stock: data.stock,
        status: data.status,
        isFeatured: data.isFeatured ?? false,
        // Don't create images here - they will be added after product is created
        variants: data.variants && data.variants.length > 0 ? {
          create: data.variants.map((variant: any) => ({
            size: variant.size || null,
            color: variant.color || null,
            model: variant.model || null,
            stock: variant.stock ?? 0,
            price: variant.price ?? null,
            sku: variant.sku || null,
          })),
        } : undefined,
      },
    });
    console.log("Product created successfully in database:", product.id);
  } catch (error: any) {
    console.error("Error creating product in database (STEP 1):", error);
    
    // Log the full error for debugging
    if (error.code === "P2022") {
      console.error("Database schema mismatch. Error details:", {
        code: error.code,
        meta: error.meta,
        message: error.message,
      });
      // Suggest regenerating Prisma client
      console.error("Try running: npx prisma generate");
    }
    
    // Product creation failed - return error WITHOUT uploading images
    return NextResponse.json(
      { 
        error: "Error al crear el producto",
        details: error.message || "Error desconocido",
        code: error.code,
      },
      { status: 500 }
    );
  }

  // STEP 2: Only if product creation succeeded, add images
  try {
    if (data.images && data.images.length > 0) {
      await prisma.productImage.createMany({
        data: data.images.map((img: any, index: number) => ({
          productId: product.id,
          url: img.url || "",
          storageKey: img.storageKey || null,
          position: img.position ?? index,
          alt: img.alt || null,
        })),
      });
      console.log("Images added to product:", product.id);
    }

    // Fetch the complete product with images and variants
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: true,
      },
    });

    return NextResponse.json(completeProduct, { status: 201 });
  } catch (error: any) {
    console.error("Error adding images to product:", error);
    
    // If adding images failed, try to delete the product to maintain consistency
    // (or you could leave it and let the user retry with images)
    try {
      await prisma.product.delete({ where: { id: product.id } });
      console.log("Deleted product due to image creation failure:", product.id);
    } catch (deleteError) {
      console.error("Failed to delete product after image creation failure:", deleteError);
    }
    
    // Clean up uploaded images from S3 if image creation failed
    if (data.images && Array.isArray(data.images)) {
      const cleanupPromises = data.images
        .filter((img: any) => img.storageKey && img.storageKey.startsWith(profile.id))
        .map((img: any) => {
          try {
            return deleteS3Object(img.storageKey);
          } catch (cleanupError) {
            console.error(`Failed to delete image ${img.storageKey}:`, cleanupError);
            return Promise.resolve();
          }
        });
      
      await Promise.allSettled(cleanupPromises);
      console.log("Cleaned up uploaded images from S3");
    }
    
    return NextResponse.json(
      { 
        error: "Error al agregar imágenes al producto",
        details: error.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}

