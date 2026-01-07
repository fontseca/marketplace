import { redirect } from "next/navigation";
import { getSessionUser, requirePhoneNumber } from "@/lib/auth";
import { PhoneUpdate } from "@/components/dashboard/phone-update";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requirePhoneNumber();
  
  const session = await getSessionUser();
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-2 text-sm text-slate-600">Administra tu información personal y preferencias</p>
      </div>

      <PhoneUpdate currentPhone={session.dbUser.phone ?? null} />
    </div>
  );
}

