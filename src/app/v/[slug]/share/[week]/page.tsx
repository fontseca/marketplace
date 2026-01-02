import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSharedCatalogProducts } from "@/lib/queries";
import { ProductCard } from "@/components/products/product-card";

type Props = { params: Promise<{ slug: string; week: string }> };

export const dynamic = 'force-dynamic';

export default async function SharedCatalogPage({ params }: Props) {
  const { slug, week } = await params;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { slug },
  });
  if (!vendor) return notFound();

  const products = await getSharedCatalogProducts(vendor.id, week);

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">Catálogo compartido</p>
        <h1 className="text-3xl font-bold text-slate-900">{vendor.displayName}</h1>
        <p className="text-slate-600">
          Productos disponibles para la semana {week}. Incluye existencias actuales
          y nuevos ingresos durante la semana.
        </p>
      </header>

      {products.length === 0 ? (
        <p className="text-slate-600">
          No hay productos disponibles para esta semana.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

