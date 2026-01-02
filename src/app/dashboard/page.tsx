import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireVendorProfile, requirePhoneNumber, getSessionUser } from "@/lib/auth";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { EventsList } from "@/components/dashboard/events-list";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function formatDay(date: Date) {
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  // Ensure user has phone number before accessing dashboard
  await requirePhoneNumber();
  
  // Check if user is root, redirect to admin dashboard
  const session = await getSessionUser();
  if (session && session.dbUser.role.name === "root") {
    redirect("/dashboard/admin");
  }
  
  const { profile } = await requireVendorProfile();

  const [lowStock, topProducts, recentSales] = await Promise.all([
    prisma.product.findMany({
      where: { vendorId: profile.id, stock: { lt: 5 }, status: "published" },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.product.findMany({
      where: { vendorId: profile.id },
      orderBy: { salesCount: "desc" },
      take: 5,
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
    prisma.productSale.findMany({
      where: { vendorId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 14,
    }),
  ]);

  const chartData = recentSales
    .reverse()
    .map((sale) => ({ label: formatDay(sale.createdAt), value: sale.quantity }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Hola, {profile.displayName}</p>
          <h1 className="text-3xl font-bold text-slate-900">Panel de vendedor</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/products/new">
            <Button>Nuevo producto</Button>
          </Link>
          <Link href={`/v/${profile.slug}`}>
            <Button variant="outline">Ver perfil público</Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="outline">Configuración</Button>
          </Link>
        </div>
      </div>

      <DashboardStats />

      <EventsList />

      <SalesChart data={chartData} title="Ventas recientes" />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Stock bajo</h3>
            <span className="text-sm text-slate-500">{lowStock.length}</span>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No hay productos con stock bajo.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-800">{p.name}</span>
                  <span className="text-sm font-semibold text-orange-600">{p.stock} uds</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Más vendidos</h3>
            <span className="text-sm text-slate-500">{topProducts.length}</span>
          </div>
          {topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Aún no hay ventas registradas.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {topProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
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
                      <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.salesCount} vendidos</p>
                    </div>
                  </div>
                  <Link
                    href={`/p/${p.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

