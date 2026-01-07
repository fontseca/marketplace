import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/products/product-card";
import { getAppUrl } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const shareLink = await prisma.catalogShareLink.findUnique({
      where: { slug },
      include: { vendor: true },
    });
    if (!shareLink) return {};

    const vendor = shareLink.vendor;
    const appUrl = getAppUrl();
    
    // Get all published products from this vendor
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
    
    // Get image: prefer vendor banner, then avatar, then first product image
    let imageUrl: string | undefined;
    if (vendor.bannerUrl) {
      imageUrl = vendor.bannerUrl;
    } else if (vendor.avatarUrl) {
      imageUrl = vendor.avatarUrl;
    } else if (products.length > 0 && products[0].images.length > 0) {
      imageUrl = products[0].images[0].url;
    }
    
    // Ensure image URL is absolute for Open Graph
    let absoluteImageUrl: string | undefined;
    if (imageUrl) {
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        absoluteImageUrl = imageUrl;
      } else if (imageUrl.startsWith("/")) {
        absoluteImageUrl = `${appUrl}${imageUrl}`;
      } else {
        // For S3 URLs or other cases, use as-is (they should already be absolute)
        absoluteImageUrl = imageUrl;
      }
    }
    
    const productCount = products.length;
    const title = `${vendor.displayName} - Catálogo de productos | Marketplace`;
    const description = productCount > 0 
      ? `Catálogo completo de ${vendor.displayName} con ${productCount} ${productCount === 1 ? 'producto' : 'productos'} disponibles.`
      : `Catálogo de productos de ${vendor.displayName}.`;
    const url = `${appUrl}/v/${slug}/share`;

    return {
      title,
      description,
      alternates: { canonical: `/v/${slug}/share` },
      openGraph: {
        title,
        description,
        url,
        type: "website",
        siteName: "Marketplace",
        images: absoluteImageUrl ? [{ 
          url: absoluteImageUrl, 
          alt: `${vendor.displayName} - Catálogo de productos`,
          width: 1200,
          height: 630,
        }] : undefined,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {};
  }
}

export default async function SharedCatalogPage({ params }: Props) {
  const { slug } = await params;
  
  let shareLink;
  let products;
  
  try {
    shareLink = await prisma.catalogShareLink.findUnique({
      where: { slug },
      include: { vendor: true },
    });
    if (!shareLink) return notFound();

    const vendor = shareLink.vendor;
    
    // Get all published products from this vendor
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

