import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ContactDeveloperPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Contactar al desarrollador</h1>
      <p className="text-slate-600">
        ¿Necesitas soporte, nuevas funcionalidades o una implementación a medida? Escríbeme y
        con gusto te ayudo.
      </p>
      <div className="space-y-3 text-slate-700">
        <p>
          Correo:{" "}
          <Link className="text-blue-600 hover:underline" href="mailto:fontseca.dev@gmail.com">
            fontseca.dev@gmail.com
          </Link>
        </p>
        <p>
          Sitio:{" "}
          <Link className="text-blue-600 hover:underline" href="https://fontseca.dev">
            fontseca.dev
          </Link>
        </p>
        <p>
          WhatsApp:{" "}
          <Link
            className="text-blue-600 hover:underline"
            href="https://wa.me/521234567890?text=Hola%20Jeremy,%20necesito%20soporte%20para%20el%20marketplace"
          >
            Enviar mensaje
          </Link>
        </p>
      </div>
      <Button asChild>
        <Link href="https://fontseca.dev" target="_blank" rel="noreferrer">
          Visitar sitio
        </Link>
      </Button>
    </div>
  );
}

