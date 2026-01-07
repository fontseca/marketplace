"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryProps = {
  images: { url: string; alt?: string }[];
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

export function ProductGallery({ images }: GalleryProps) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const current = images[active];
  
  const currentImageUrl = useMemo(() => current ? getImageUrl(current.url) : null, [current]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        className="relative aspect-square w-full max-w-full sm:max-w-md lg:max-w-sm mx-auto cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-50"
        onClick={() => setOpen(true)}
      >
        {currentImageUrl ? (
          <Image
            src={currentImageUrl}
            alt={current.alt ?? "Imagen del producto"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 448px"
            className="h-full w-full object-cover"
            unoptimized={currentImageUrl.includes("/api/images/proxy")}
          />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {images.map((img, index) => {
            const imageUrl = getImageUrl(img.url);
            return (
              <button
                key={img.url}
                className={cn(
                  "relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl border transition-all",
                  active === index
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-slate-200 hover:border-slate-300",
                )}
                onClick={() => setActive(index)}
                aria-label={`Ver imagen ${index + 1}`}
              >
                <Image
                  src={imageUrl}
                  alt={img.alt ?? `Imagen del producto ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={imageUrl.includes("/api/images/proxy")}
                />
              </button>
            );
          })}
        </div>
      )}

      {open && currentImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <button
            className="absolute right-4 top-4 text-white"
            onClick={() => setOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative h-[80vh] w-full max-w-4xl overflow-hidden rounded-3xl">
            <Image
              src={currentImageUrl}
              alt={current.alt ?? "Imagen del producto"}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-contain"
              unoptimized={currentImageUrl.includes("/api/images/proxy")}
            />
          </div>
        </div>
      )}
    </div>
  );
}

