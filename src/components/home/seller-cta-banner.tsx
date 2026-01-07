"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

export function SellerCtaBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative rounded-2xl sm:rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 shadow-sm">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
        <div className="flex-1">
          <p className="text-sm sm:text-base font-medium text-slate-900">
            ¿Vendes productos? Únete y publica tu catálogo gratis
          </p>
        </div>
        <div className="flex-shrink-0">
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" className="w-full sm:w-auto">
                Comenzar a vender
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="sm" className="w-full sm:w-auto">
                Ir al panel
              </Button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

