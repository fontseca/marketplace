import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireRootUser } from "@/lib/auth";
import { deleteS3Object, extractS3KeyFromUrl } from "@/lib/s3";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, { params }: Params) {
  try {
    await requireRootUser();
  } catch (error) {
    return NextResponse.json(
      { error: "No autorizado. Solo usuarios root pueden eliminar usuarios." },
      { status: 403 }
    );
  }

  const { id } = await params;

  // Get the user to delete
  const userToDelete = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      vendorProfile: true,
    },
  });

  if (!userToDelete) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // Prevent self-deletion
  const session = await getSessionUser();
  if (session && session.dbUser.id === id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta" },
      { status: 400 }
    );
  }

  try {
    // If user has a vendor profile, cascade delete all related data
    if (userToDelete.vendorProfile) {
      const vendorId = userToDelete.vendorProfile.id;

      // 1. Get all products for this vendor to delete images
      const products = await prisma.product.findMany({
        where: { vendorId },
        include: { images: true },
      });

      // 2. Delete ProductEvents
      await prisma.productEvent.deleteMany({
        where: { vendorId },
      });

      // 3. Delete ProductSales
      await prisma.productSale.deleteMany({
        where: { vendorId },
      });

      // 4. Delete ProductImages and S3 cleanup
      for (const product of products) {
        for (const image of product.images) {
          if (image.storageKey) {
            try {
              await deleteS3Object(image.storageKey);
            } catch (error) {
              console.error(`Failed to delete S3 image ${image.storageKey}:`, error);
            }
          }
        }
      }
      await prisma.productImage.deleteMany({
        where: {
          productId: {
            in: products.map((p) => p.id),
          },
        },
      });

      // 5. Delete ProductVariants
      await prisma.productVariant.deleteMany({
        where: {
          productId: {
            in: products.map((p) => p.id),
          },
        },
      });

      // 6. Delete Products
      await prisma.product.deleteMany({
        where: { vendorId },
      });

      // 7. Delete CatalogShareLinks
      await prisma.catalogShareLink.deleteMany({
        where: { vendorId },
      });

      // 8. Delete Brands
      await prisma.brand.deleteMany({
        where: { vendorId },
      });

      // 9. Delete vendor profile images from S3
      const { avatarUrl, bannerUrl } = userToDelete.vendorProfile;
      const imageUrls = [avatarUrl, bannerUrl].filter(Boolean) as string[];
      
      for (const url of imageUrls) {
        const s3Key = extractS3KeyFromUrl(url);
        if (s3Key) {
          try {
            await deleteS3Object(s3Key);
          } catch (error) {
            console.error(`Failed to delete S3 image ${s3Key}:`, error);
          }
        }
      }

      // 10. Delete VendorProfile
      await prisma.vendorProfile.delete({
        where: { id: vendorId },
      });
    }

    // 11. Delete User
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Error al eliminar el usuario", details: error.message },
      { status: 500 }
    );
  }
}

