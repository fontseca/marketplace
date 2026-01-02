"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import debounce from "lodash.debounce";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type Result = {
  id: string;
  name: string;
  slug: string;
  description: string;
  regularPrice: string;
  salePrice: string | null;
  stock: number;
  imageUrl: string | null;
  vendor: { id: string; displayName: string; slug: string };
};

type Props = {
  placeholder?: string;
};

export function SearchBar({ placeholder = "Buscar productos..." }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!value.trim()) {
          setResults([]);
          return;
        }
        setLoading(true);
        try {
          const res = await fetch(`/api/products/search?q=${encodeURIComponent(value)}`);
          const data = await res.json();
          setResults(data);
        } finally {
          setLoading(false);
        }
      }, 500),
    [],
  );

  useEffect(() => {
    runSearch(query);
    return () => runSearch.cancel();
  }, [query, runSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
        <Search className="h-4 w-4 text-slate-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-none px-0 shadow-none focus:ring-0"
          placeholder={placeholder}
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg">
          <ul className="max-h-80 overflow-y-auto">
            {results.map((item) => (
              <li
                key={item.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50"
                onClick={() => router.push(`/p/${item.id}`)}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-slate-100" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{item.vendor.displayName}</p>
                </div>
                <div className="text-sm font-semibold">
                  {(() => {
                    const priceStr = item.salePrice ?? item.regularPrice;
                    if (!priceStr) return "N/A";
                    const price = Number(priceStr);
                    return isNaN(price) ? "N/A" : formatCurrency(price);
                  })()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

