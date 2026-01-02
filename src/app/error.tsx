"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: ErrorProps) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="text-sm font-semibold text-red-600">Error</p>
      <h1 className="mt-2 text-3xl font-bold">Algo salió mal</h1>
      <p className="mt-2 text-slate-600">
        Tuvimos un problema inesperado. Intenta nuevamente o regresa al inicio.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" onClick={() => reset()}>
          Reintentar
        </Button>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

