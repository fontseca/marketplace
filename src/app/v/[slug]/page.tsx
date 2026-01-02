import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/products/product-card";
import { ShareCatalogButton } from "@/components/vendors/share-catalog-button";
import { getVendorWithProducts } from "@/lib/queries";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export default async function VendorProfilePage({ params }: Props) {
  const { slug } = await params;
  const vendor = await getVendorWithProducts(slug);
  if (!vendor) return notFound();

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="secondary">Vendedor</Badge>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{vendor.displayName}</h1>
            <p className="text-slate-600">{vendor.bio ?? "Información del vendedor"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {vendor.whatsapp && (
                <Link
                  href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}`}
                  className="text-blue-600 hover:underline"
                >
                  WhatsApp
                </Link>
              )}
              {vendor.website && (
                <Link href={vendor.website as any} className="text-blue-600 hover:underline">
                  Sitio web
                </Link>
              )}
            </div>
          </div>
          <ShareCatalogButton />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Catálogo</h2>
          <p className="text-sm text-slate-500">{vendor.products.length} productos</p>
        </div>
        {vendor.products.length === 0 ? (
          <p className="text-slate-600">Aún no hay productos publicados.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendor.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

