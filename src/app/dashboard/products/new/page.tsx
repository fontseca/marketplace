import { prisma } from "@/lib/db";
import { requireVendorProfile } from "@/lib/auth";
import { ProductForm } from "@/components/products/product-form";

export default async function NewProductPage() {
  await requireVendorProfile();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-slate-500">Nuevo producto</p>
        <h1 className="text-3xl font-bold text-slate-900">Crear publicación</h1>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}

