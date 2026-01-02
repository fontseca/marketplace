import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            Created by Jeremy Fonseca {"<"}fontseca.dev@gmail.com{">"}
          </p>
          <Link
            href="https://fontseca.dev"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            fontseca.dev
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Link href="/contactar" className="hover:text-slate-900">
            Contactar al desarrollador
          </Link>
          <Link href="/politicas" className="hover:text-slate-900">
            Políticas
          </Link>
          <Link href="/ayuda" className="hover:text-slate-900">
            Ayuda
          </Link>
        </div>
      </div>
    </footer>
  );
}

