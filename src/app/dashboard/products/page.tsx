import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireVendorProfile, getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { AdminProductsTable } from "@/components/dashboard/admin-products-table";

export default async function ProductsDashboardPage() {
  const session = await getSessionUser();
  const isRoot = session?.dbUser.role.name === "root";

  // If root user, show all products with admin table
  if (isRoot) {
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        vendor: {
          select: {
            id: true,
            displayName: true,
            slug: true,
          },
        },
      },
    });

    // Convert Decimal to number for client component
    const serializedProducts = products.map((p) => ({
      ...p,
      regularPrice: Number(p.regularPrice),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
    }));

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Productos</p>
            <h1 className="text-3xl font-bold text-slate-900">Administrar publicaciones</h1>
          </div>
        </div>

        <AdminProductsTable products={serializedProducts} />
      </div>
    );
  }

  // Regular vendor view
  const { profile } = await requireVendorProfile();
  const products = await prisma.product.findMany({
    where: { vendorId: profile.id },
    orderBy: { updatedAt: "desc" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Productos</p>
          <h1 className="text-3xl font-bold text-slate-900">Administrar publicaciones</h1>
        </div>
        <Link href="/dashboard/products/new">
          <Button>Nuevo producto</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-slate-600">Aún no hay productos. Crea tu primera publicación.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0]?.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0].url}
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(Number(p.salePrice ?? p.regularPrice))}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3 capitalize">{p.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/products/${p.id}/edit`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

