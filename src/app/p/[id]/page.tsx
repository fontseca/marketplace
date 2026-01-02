import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import { getAppUrl, formatCurrency } from "@/lib/utils";
import {
  getProductDetail,
  getMoreFromVendor,
  getSimilarProducts,
  getBestSellers,
} from "@/lib/queries";
import { ProductGallery } from "@/components/products/product-gallery";
import { OfferCountdown } from "@/components/products/offer-countdown";
import { ShareButton } from "@/components/shared/share-button";
import { ProductCard } from "@/components/products/product-card";
import { Badge } from "@/components/ui/badge";
import { PurchaseCta } from "@/components/products/purchase-cta";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductDetail(id);
  if (!product) return {};
  const image = product.images[0]?.url;
  const title = `${product.name} | ${product.brand?.name ?? "Producto"}`;
  const description = product.description.slice(0, 160);
  const url = `${getAppUrl()}/p/${product.id}`;

  return {
    title,
    description,
    alternates: { canonical: `/p/${product.id}` },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Marketplace",
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductDetail(id);
  if (!product) return notFound();

  const [moreFromVendor, similarProducts, bestSellers] = await Promise.all([
    getMoreFromVendor(product.vendorId, product.id),
    getSimilarProducts(product.id, product.vendorId),
    getBestSellers(),
  ]);

  const hasSale = Boolean(product.salePrice);
  const price = Number(product.salePrice ?? product.regularPrice);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <ProductGallery
          images={product.images.map((img) => ({
            url: img.url,
            alt: img.alt ?? undefined,
          }))}
        />
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Descripción</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700">
            {product.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
            {(product.brand || product.brandName) && (
              <Badge variant="secondary">Marca: {product.brand?.name ?? product.brandName}</Badge>
            )}
            {product.category && (
              <Badge variant="secondary">Categoría: {product.category.name}</Badge>
            )}
            <Badge variant="secondary">
              Stock: {product.stock > 0 ? product.stock : "Sin stock"}
            </Badge>
          </div>
        </section>

        {similarProducts.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Productos similares
              </h3>
              <p className="text-sm text-slate-500">{similarProducts.length} items</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}

        {bestSellers.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Te podría interesar
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bestSellers.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Vendido por</p>
              <p className="text-lg font-semibold text-slate-900">
                {product.vendor.displayName}
              </p>
              <p className="text-sm text-slate-500">@{product.vendor.slug}</p>
            </div>
            {product.images[0]?.url && (() => {
              const imageUrl = product.images[0].url.includes("s3.") || product.images[0].url.includes("amazonaws.com")
                ? `/api/images/proxy?url=${encodeURIComponent(product.images[0].url)}`
                : product.images[0].url;
              return (
                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized={imageUrl.includes("/api/images/proxy")}
                  />
                </div>
              );
            })()}
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(price)}
            </div>
            {hasSale && (
              <div className="text-sm text-slate-500 line-through">
                {formatCurrency(Number(product.regularPrice))}
              </div>
            )}
            {product.saleExpiresAt && <OfferCountdown expiresAt={product.saleExpiresAt} />}
          </div>

          <div className="mt-6 space-y-3">
            <PurchaseCta
              productId={product.id}
              vendorWhatsapp={product.vendor.whatsapp || product.vendor.user?.phone || undefined}
              productName={product.name}
              vendorName={product.vendor.displayName}
              productSlug={product.id}
            />
            <ShareButton url={`${getAppUrl()}/p/${product.id}`} />
          </div>
        </section>

        {product.variants.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Variantes</h3>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-700">
              {product.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span>
                      {variant.size && `Talla ${variant.size} `}
                      {variant.color && `Color ${variant.color} `}
                      {variant.model && `Modelo ${variant.model}`}
                    </span>
                    {variant.sku && (
                      <span className="text-xs text-slate-500">SKU: {variant.sku}</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(Number(variant.price ?? price))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {moreFromVendor.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Más productos de {product.vendor.displayName}
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {moreFromVendor.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}

