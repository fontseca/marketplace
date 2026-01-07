import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getHomeProducts, getBestSellers } from "@/lib/queries";
import { ProductCard } from "@/components/products/product-card";
import { SearchBar } from "@/components/search/search-bar";
import { getAppUrl } from "@/lib/utils";

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const title = "Marketplace | Catálogos de vendedores";
  const description = "Marketplace colaborativo para publicar y mostrar productos con variantes, ofertas y contacto directo por WhatsApp.";
  const url = getAppUrl();

  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Marketplace",
    },
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const { q, category } = await searchParams;

  let products: Awaited<ReturnType<typeof getHomeProducts>> = [];
  let bestSellers: Awaited<ReturnType<typeof getBestSellers>> = [];
  let categories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];

  try {
    [products, bestSellers, categories] = await Promise.all([
      getHomeProducts({
        search: q,
        categorySlug: category,
        take: 30,
      }),
      getBestSellers(),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);
  } catch (error: any) {
    // Handle case where database tables don't exist yet
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      console.warn("Database tables not found. Please run migrations:", error);
      // Continue with empty arrays
    } else {
      throw error;
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {/*
        
        <section className="rounded-3xl bg-gradient-to-r from-blue-50 to-purple-50 p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-700">Marketplace</p>
            <h1 className="text-3xl font-bold text-slate-900">
              Catálogo moderno para perfumes, ropa, bolsos, peluches y más
            </h1>
            <p className="mt-2 text-slate-600">
              Explora publicaciones de vendedores verificados, filtra por precio, marca o
              categoría y contacta por WhatsApp.
            </p>
          </div>
          <div className="w-full max-w-md">
            <SearchBar placeholder="Buscar productos..." />
          </div>
        </div>
      </section>
        */}

      <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <form className="flex flex-col gap-4 md:grid md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-700">
              Nombre
            </label>
            <input
              name="q"
              defaultValue={q ?? ""}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Buscar por nombre"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-semibold text-slate-700">
              Categoría
            </label>
            <select
              name="category"
              defaultValue={category ?? ""}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto rounded-full bg-slate-900 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800"
            >
              Aplicar filtros
            </button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            Todos los productos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Se muestran {products.length} resultados
          </p>
        </div>
        {products.length === 0 ? (
          <p className="text-sm sm:text-base text-slate-600">
            No hay productos que coincidan con la búsqueda.
          </p>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {bestSellers.length > 0 && (
        <section className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              Productos más vendidos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Top {bestSellers.length}</p>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
