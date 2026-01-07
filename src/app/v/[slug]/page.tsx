import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/products/product-card";
import { ShareCatalogButton } from "@/components/vendors/share-catalog-button";
import { getVendorWithProducts } from "@/lib/queries";
import { getAppUrl } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const vendor = await getVendorWithProducts(slug);
    if (!vendor) return {};

    const appUrl = getAppUrl();
    
    // Get image: prefer banner, then avatar, then first product image
    let imageUrl: string | undefined;
    if (vendor.bannerUrl) {
      imageUrl = vendor.bannerUrl;
    } else if (vendor.avatarUrl) {
      imageUrl = vendor.avatarUrl;
    } else if (vendor.products.length > 0 && vendor.products[0].images.length > 0) {
      imageUrl = vendor.products[0].images[0].url;
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

    const title = `${vendor.displayName} | Marketplace`;
    const description = vendor.bio ?? `Catálogo de productos de ${vendor.displayName}`;
    const url = `${appUrl}/v/${slug}`;

    return {
      title,
      description,
      alternates: { canonical: `/v/${slug}` },
      openGraph: {
        title,
        description,
        url,
        type: "profile",
        siteName: "Marketplace",
        images: absoluteImageUrl ? [{ 
          url: absoluteImageUrl, 
          alt: vendor.displayName,
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

export default async function VendorProfilePage({ params }: Props) {
  const { slug } = await params;
  
  let vendor;
  try {
    vendor = await getVendorWithProducts(slug);
    if (!vendor) return notFound();
  } catch (error: any) {
    console.error("Error loading vendor:", error);
    // If it's a database connection issue, return not found
    if (error?.code === "P1001" || error?.code === "P1017") {
      return notFound();
    }
    // Re-throw other errors to be handled by error boundary
    throw error;
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="text-xs">Vendedor</Badge>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 truncate">{vendor.displayName}</h1>
            <p className="text-sm sm:text-base text-slate-600">{vendor.bio ?? "Información del vendedor"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600">
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
          <ShareCatalogButton vendorSlug={vendor.slug} />
        </div>
      </section>

      <section className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Catálogo</h2>
          <p className="text-xs sm:text-sm text-slate-500">{vendor.products.length} productos</p>
        </div>
        {vendor.products.length === 0 ? (
          <p className="text-sm sm:text-base text-slate-600">Aún no hay productos publicados.</p>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
            {vendor.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

