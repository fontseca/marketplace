import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema, productImageSchema } from "@/lib/validators";
import { getSessionUser, requireVendorProfile } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { deleteS3Object } from "@/lib/s3";
import { z } from "zod";

type Params = {
  params: Promise<{ id: string }>;
};

async function authorizeProduct(productId: string, userId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      vendor: true,
      images: true, // Include images for deletion
    },
  });
  if (!product) return { product: null, allowed: false };

  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    include: { role: true } 
  });
  
  const isRootUser = user?.role.name === "root";

  const userVendor = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  const allowed = isRootUser || userVendor?.id === product.vendorId;
  return { product, allowed };
}

export async function GET(_: Request, { params }: Params) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;

  const data = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
      vendor: true,
      brand: true,
      category: true,
    },
  });

  if (!data) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;

    const { product, allowed } = await authorizeProduct(id, session.dbUser.id);
    if (!allowed || !product) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
    }
    
    // Create a more lenient schema for updates that allows partial data
    // For updates, images can be empty (they're updated separately)
    const updateSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").optional(),
    description: z.string().optional(),
    brandName: z.string().min(1, "Marca requerida").max(100).optional().nullable(),
    categoryId: z.string().optional().nullable(),
    regularPrice: z.number().min(0.01, "El precio regular debe ser mayor a 0").optional(),
    salePrice: z
      .preprocess(
        (val) => {
          if (val === "" || val === null || val === undefined) return null;
          const num = Number(val);
          return isNaN(num) ? null : num;
        },
        z.union([z.number().min(0), z.null()])
      )
      .optional(),
    saleExpiresAt: z
      .preprocess(
        (val) => {
          if (val === "" || val === null || val === undefined) return null;
          return val;
        },
        z.union([z.string().datetime(), z.null()])
      )
      .optional(),
    stock: z.number().int().min(0, "El stock debe ser mayor o igual a 0").optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    isFeatured: z.boolean().optional(),
    images: z.array(productImageSchema).optional(), // Images are optional for updates
    variants: z.array(z.object({
      size: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      model: z.string().optional().nullable(),
      sku: z.string().optional().nullable(),
      price: z.number().optional().nullable(),
      stock: z.number().int().min(0).default(0),
    })).optional(),
    });
    
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation error:", JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json({ 
        error: "Error de validación",
        details: parsed.error.format() 
      }, { status: 400 });
    }

    const data = parsed.data;

    let brandId = product.brandId;
    if (data.brandName && data.brandName.trim().length > 0) {
      const brandSlug = slugify(data.brandName);
      const brand = await prisma.brand.upsert({
        where: { vendorId_slug: { vendorId: product.vendorId, slug: brandSlug } },
        update: { name: data.brandName },
        create: { vendorId: product.vendorId, name: data.brandName, slug: brandSlug },
      });
      brandId = brand.id;
    } else if (data.brandName === null) {
      brandId = null;
    }

    const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      name: data.name ?? product.name,
      slug: data.name ? slugify(data.name) : product.slug,
      description: data.description ?? product.description,
      brandId,
      brandName: data.brandName ?? product.brandName,
      categoryId: data.categoryId ?? product.categoryId,
      regularPrice: data.regularPrice ?? product.regularPrice,
      salePrice: data.salePrice ?? product.salePrice,
      saleExpiresAt: data.saleExpiresAt ? new Date(data.saleExpiresAt) : product.saleExpiresAt,
      stock: data.stock ?? product.stock,
      status: data.status ?? product.status,
      isFeatured: data.isFeatured ?? product.isFeatured,
      images: data.images
        ? {
            deleteMany: { productId: product.id },
            create: data.images
              .filter((img) => img.url) // Filter out images without URLs
              .map((img) => ({
                url: img.url!,
                storageKey: img.storageKey ?? null,
              position: img.position ?? 0,
                alt: img.alt ?? null,
            })),
          }
        : undefined,
      variants: data.variants
        ? {
            deleteMany: { productId: product.id }, // Delete existing variants first
            create: data.variants.map((variant) => ({
              size: variant.size ?? null,
              color: variant.color ?? null,
              model: variant.model ?? null,
              stock: variant.stock ?? 0,
              price: variant.price ?? null,
              sku: variant.sku ?? null,
            })),
          }
        : undefined,
    },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
    },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error al actualizar el producto", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  const { product, allowed } = await authorizeProduct(id, session.dbUser.id);
  if (!allowed || !product) {
    return NextResponse.json({ error: "Sin permisos o producto no encontrado" }, { status: 403 });
  }

  // Delete images from S3 first (before database deletion)
  if (product.images && product.images.length > 0) {
    const deletePromises = product.images
      .filter((img) => img.storageKey) // Only delete images with storageKey (S3 images)
      .map((img) => {
        try {
          return deleteS3Object(img.storageKey!);
        } catch (error) {
          console.error(`Failed to delete image ${img.storageKey}:`, error);
          return Promise.resolve();
        }
      });

    await Promise.allSettled(deletePromises);
    console.log(`Deleted ${product.images.length} images from S3 for product ${id}`);
  }

  // Delete all related records first (to avoid foreign key constraints)
  // Order matters: delete child records before parent
  
  // 1. Delete product events
  await prisma.productEvent.deleteMany({
    where: { productId: id },
  });

  // 2. Delete product sales
  await prisma.productSale.deleteMany({
    where: { productId: id },
  });

  // 3. Delete product images
  await prisma.productImage.deleteMany({
    where: { productId: id },
  });

  // 4. Delete product variants
  await prisma.productVariant.deleteMany({
    where: { productId: id },
  });

  // 5. Now delete the product
  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

