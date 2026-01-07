import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRootUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/dashboard/users-table";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await requireRootUser();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      role: true,
      vendorProfile: {
        select: {
          id: true,
          displayName: true,
          slug: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Usuarios</p>
          <h1 className="text-3xl font-bold text-slate-900">Gestionar usuarios</h1>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">Volver al panel</Button>
        </Link>
      </div>

      <UsersTable users={users} />
    </div>
  );
}

