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

export function ProductCard({ product }: ProductCardProps) {
  const price = Number(product.salePrice ?? product.regularPrice);
  const hasSale = Boolean(product.salePrice);
  const image = product.images?.[0]?.url;

  return (
    <Link href={`/p/${product.id}`}>
      <Card className="group flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              priority={false}
            />
          ) : (
            <div className="h-full w-full" />
          )}
          {hasSale && (
            <div className="absolute left-3 top-3">
              <Badge variant="secondary">Oferta</Badge>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
              {product.name}
            </h3>
            <Badge variant="secondary">
              {product.stock > 0 ? "En stock" : "Sin stock"}
            </Badge>
          </div>
          {product.vendor && (
            <p className="text-xs text-slate-500">
              por {product.vendor.displayName}
            </p>
          )}
          <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
          <div className="mt-auto flex items-center gap-2">
            <span className="text-lg font-semibold text-blue-700">
              {formatCurrency(price)}
            </span>
            {hasSale && (
              <span className="text-sm text-slate-400 line-through">
                {formatCurrency(Number(product.regularPrice))}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

