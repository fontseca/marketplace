import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRootUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function VendorsPage() {
  await requireRootUser();

  const vendors = await prisma.vendorProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          phone: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Vendedores</p>
          <h1 className="text-3xl font-bold text-slate-900">Gestionar vendedores</h1>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">Volver al panel</Button>
        </Link>
      </div>

      {vendors.length === 0 ? (
        <p className="text-slate-600">No hay vendedores registrados.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Productos</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{vendor.displayName}</p>
                      <p className="text-xs text-slate-500">@{vendor.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{vendor.user.email}</td>
                  <td className="px-4 py-3">{vendor.user.phone || "N/A"}</td>
                  <td className="px-4 py-3">{vendor._count.products}</td>
                  <td className="px-4 py-3">{vendor.whatsapp || "N/A"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/v/${vendor.slug}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ver perfil
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

