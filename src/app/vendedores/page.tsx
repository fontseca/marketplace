import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function VendorsPage() {
  const vendors = await prisma.vendorProfile.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-slate-500">Vendedores</p>
        <h1 className="text-3xl font-bold text-slate-900">Catálogos</h1>
      </div>
      {vendors.length === 0 ? (
        <p className="text-slate-600">Aún no hay vendedores registrados.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/v/${vendor.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1"
            >
              <p className="text-sm font-semibold text-blue-700">Vendedor</p>
              <h3 className="text-lg font-bold text-slate-900">{vendor.displayName}</h3>
              <p className="text-sm text-slate-600 line-clamp-2">
                {vendor.bio ?? "Catálogo de productos"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

