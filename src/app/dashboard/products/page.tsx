import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireVendorProfile, getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AdminProductsTable } from "@/components/dashboard/admin-products-table";
import { VendorProductsTable } from "@/components/dashboard/vendor-products-table";

export const dynamic = 'force-dynamic';

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
        <Link href="/dashboard/products/new">
          <Button>Nuevo producto</Button>
        </Link>
      </div>

      <VendorProductsTable products={serializedProducts} />
    </div>
  );
}

