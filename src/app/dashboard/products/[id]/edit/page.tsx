import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireVendorProfile, getSessionUser } from "@/lib/auth";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) return notFound();
  
  const isRoot = session.dbUser.role.name === "root";
  const { id } = await params;

  // If root user, allow editing any product
  // Otherwise, require vendor profile and only allow editing own products
  let product;
  if (isRoot) {
    product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
      },
    });
  } else {
    const { profile } = await requireVendorProfile();
    product = await prisma.product.findUnique({
      where: { id, vendorId: profile.id },
      include: {
        images: true,
        variants: true,
      },
    });
  }
  
  if (!product) return notFound();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Editar producto</p>
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
        </div>
        <Link href="/dashboard/products">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>
      <ProductForm
        initialData={{
          id: product.id,
          name: product.name,
          description: product.description,
          brandName: product.brandName ?? undefined,
          categoryId: product.categoryId ?? undefined,
          regularPrice: Number(product.regularPrice),
          salePrice: product.salePrice ? Number(product.salePrice) : undefined,
          saleExpiresAt: product.saleExpiresAt?.toISOString().slice(0, 16),
          stock: product.stock,
          status: product.status,
          images: product.images.map((img) => ({
            url: img.url,
            storageKey: img.storageKey ?? undefined,
            position: img.position,
            alt: img.alt ?? undefined,
          })),
          variants: product.variants.map((v) => ({
            size: v.size ?? undefined,
            color: v.color ?? undefined,
            model: v.model ?? undefined,
            stock: v.stock,
            price: v.price ? Number(v.price) : undefined,
            sku: v.sku ?? undefined,
          })),
        }}
        categories={categories}
      />
    </div>
  );
}

