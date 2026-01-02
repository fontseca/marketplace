import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InternalError() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="text-sm font-semibold text-red-600">500</p>
      <h1 className="mt-2 text-3xl font-bold">Error interno</h1>
      <p className="mt-2 text-slate-600">
        Ocurrió un error en el servidor. Nuestro equipo ya fue notificado.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

