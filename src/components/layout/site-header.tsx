"use client";

import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
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
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:text-slate-900"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
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
        </div>
      </header>

      {/* Mobile Menu Sidebar */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-xl md:hidden">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <span className="font-semibold text-slate-900">Menú</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-slate-700 hover:text-slate-900"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Inicio
              </Link>
              <Link
                href="/vendedores"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Vendedores
              </Link>
            </nav>
            <div className="border-t border-slate-200 p-4">
              <SignedIn>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="mb-3 block"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                    Panel
                  </Button>
                </Link>
                <div className="flex items-center justify-center">
                  <UserButton />
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="sm" className="w-full text-xs sm:text-sm" onClick={() => setMenuOpen(false)}>
                    Iniciar sesión
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </>
      )}
    </>
  );
}
