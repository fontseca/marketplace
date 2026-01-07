import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/products/product-card";
import { getAppUrl } from "@/lib/utils";

type Props = { params: Promise<{ slug: string; week: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug, week } = await params;
    const shareLink = await prisma.catalogShareLink.findUnique({
      where: { slug },
      include: { vendor: true },
    });
    if (!shareLink) return {};

    const vendor = shareLink.vendor;
    
    // Get all published products from this vendor (not filtered by week)
    const products = await prisma.product.findMany({
      where: {
        vendorId: vendor.id,
        status: "published",
      },
      include: {
        images: { orderBy: { position: "asc" } },
      },
      orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    });
    
    const firstProductImage = products[0]?.images[0]?.url;
    
    const title = `${vendor.displayName} - Catálogo de productos | Marketplace`;
    const description = `Catálogo completo de productos de ${vendor.displayName}.`;
    const url = `${getAppUrl()}/v/${slug}/share/${week}`;

    return {
      title,
      description,
      alternates: { canonical: `/v/${slug}/share/${week}` },
      openGraph: {
        title,
        description,
        url,
        type: "website",
        siteName: "Marketplace",
        images: firstProductImage ? [{ url: firstProductImage, alt: `${vendor.displayName} - Catálogo de productos` }] : undefined,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {};
  }
}

export default async function SharedCatalogPage({ params }: Props) {
  const { slug, week } = await params;
  
  let shareLink;
  let products;
  
  try {
    shareLink = await prisma.catalogShareLink.findUnique({
      where: { slug },
      include: { vendor: true },
    });
    if (!shareLink) return notFound();

    // Ensure the week parameter matches the share link's week label
    if (shareLink.weekLabel !== week) {
      return notFound();
    }

    const vendor = shareLink.vendor;
    
    // Get all published products from this vendor (not filtered by week)
    products = await prisma.product.findMany({
      where: {
        vendorId: vendor.id,
        status: "published",
      },
      include: {
        images: { orderBy: { position: "asc" } },
      },
      orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    });
  } catch (error: any) {
    console.error("Error loading shared catalog:", error);
    // If it's a database connection issue, return not found
    if (error?.code === "P1001" || error?.code === "P1017") {
      return notFound();
    }
    // Re-throw other errors to be handled by error boundary
    throw error;
  }
  
  // shareLink is guaranteed to exist here since we would have returned notFound() if it didn't
  const vendor = shareLink.vendor;

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">Catálogo de productos</p>
        <h1 className="text-3xl font-bold text-slate-900">{vendor.displayName}</h1>
        <p className="text-slate-600">
          Catálogo completo de productos disponibles.
        </p>
      </header>

      {products.length === 0 ? (
        <p className="text-slate-600">
          No hay productos disponibles.
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

