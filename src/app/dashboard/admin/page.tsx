import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRootUser } from "@/lib/auth";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  await requireRootUser();

  const [users, vendors, products, events, pendingEvents, totalSales] =
    await Promise.all([
      prisma.user.count(),
      prisma.vendorProfile.count(),
      prisma.product.count(),
      prisma.productEvent.count(),
      prisma.productEvent.count({ where: { status: "pending" } }),
      prisma.productSale.aggregate({ _sum: { amount: true, quantity: true } }),
    ]);

  const stats = [
    { label: "Usuarios", value: users },
    { label: "Vendedores", value: vendors },
    { label: "Productos", value: products },
    { label: "Eventos pendientes", value: pendingEvents },
    {
      label: "Ventas totales",
      value: totalSales._sum.quantity ?? 0,
      helper: `Ingresos ${Number(totalSales._sum.amount ?? 0).toFixed(2)} USD`,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Root admin</p>
          <h1 className="text-3xl font-bold text-slate-900">Panel administrativo</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="outline">Ir al sitio</Button>
          </Link>
        </div>
      </div>

      <StatsGrid stats={stats} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Acciones rápidas</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/products">
            <Button variant="outline">Gestionar productos</Button>
          </Link>
          <Link href="/dashboard/events">
            <Button variant="outline">Ver eventos</Button>
          </Link>
          <Link href="/dashboard/admin/categories">
            <Button variant="outline">Gestionar categorías</Button>
          </Link>
          <Link href="/dashboard/vendors">
            <Button variant="outline">Vendedores</Button>
          </Link>
          <Link href="/dashboard/admin/users">
            <Button variant="outline">Gestionar usuarios</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

