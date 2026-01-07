import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    regularPrice: any;
    salePrice?: any | null;
    saleExpiresAt?: Date | string | null;
    stock: number;
    vendor?: { displayName: string; slug: string };
    images?: { url: string }[];
  };
};

// Helper to get image URL - use proxy for S3 images to avoid CORS
function getImageUrl(url: string): string {
  if (!url) return url;
  // If it's an S3 URL, use the proxy
  if (url.includes("s3.") || url.includes("amazonaws.com")) {
    return `/api/images/proxy?url=${encodeURIComponent(url)}`;
  }
  // If it's a relative URL, use it directly
  if (url.startsWith("/")) {
    return url;
  }
  // For other absolute URLs, use them directly
  return url;
}

export function ProductCard({ product }: ProductCardProps) {
  const price = Number(product.salePrice ?? product.regularPrice);
  const hasSale = Boolean(product.salePrice);
  const image = product.images?.[0]?.url;
  const imageUrl = image ? getImageUrl(image) : null;

  return (
    <Link href={`/p/${product.id}`}>
      <Card className="group flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              priority={false}
              unoptimized={imageUrl.includes("/api/images/proxy")}
            />
          ) : (
            <div className="h-full w-full" />
          )}
          {hasSale && (
            <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
              <Badge variant="secondary" className="text-xs">Oferta</Badge>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 sm:gap-2 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2 flex-1 min-w-0">
              {product.name}
            </h3>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {product.stock > 0 ? "En stock" : "Sin stock"}
            </Badge>
          </div>
          {product.vendor && (
            <p className="text-xs text-slate-500 truncate">
              por {product.vendor.displayName}
            </p>
          )}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{product.description}</p>
          <div className="mt-auto flex items-center gap-2">
            <span className="text-base sm:text-lg font-semibold text-blue-700">
              {formatCurrency(price)}
            </span>
            {hasSale && (
              <span className="text-xs sm:text-sm text-slate-400 line-through">
                {formatCurrency(Number(product.regularPrice))}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

