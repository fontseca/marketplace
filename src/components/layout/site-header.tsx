import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 font-semibold">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-blue-600 text-white text-sm sm:text-base">
              MX
            </span>
            {/*
<div className="leading-tight">
              <div>Marketplace</div>
              <p className="text-xs text-slate-500">Catálogo colaborativo</p>
            </div>
*/}
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-slate-700 md:flex">
            <Link href="/">Inicio</Link>
            <Link href="/vendedores">Vendedores</Link>
            {/* <Link href="/contactar">Contactar al desarrollador</Link> */}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                Panel
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" className="text-xs sm:text-sm">Iniciar sesión</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
