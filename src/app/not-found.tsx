import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="text-sm font-semibold text-blue-600">404</p>
      <h1 className="mt-2 text-3xl font-bold">Página no encontrada</h1>
      <p className="mt-2 text-slate-600">
        No pudimos localizar el recurso que buscas. Revisa la URL o vuelve al
        inicio.
      </p>
      <div className="mt-6 flex justify-center">
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

