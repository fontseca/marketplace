import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ServiceUnavailable() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="text-sm font-semibold text-amber-600">503</p>
      <h1 className="mt-2 text-3xl font-bold">Servicio no disponible</h1>
      <p className="mt-2 text-slate-600">
        Estamos en mantenimiento o con alta demanda. Intenta de nuevo en unos
        minutos.
      </p>
      <div className="mt-6 flex justify-center">
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

