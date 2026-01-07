import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getAppUrl } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Marketplace | Catálogos de vendedores",
  description:
    "Marketplace colaborativo para publicar y mostrar productos con variantes, ofertas y contacto directo por WhatsApp.",
  metadataBase: new URL(appUrl),
  openGraph: {
    title: "Marketplace",
    description:
      "Marketplace colaborativo para publicar y mostrar productos con variantes, ofertas y contacto directo por WhatsApp.",
    url: appUrl,
    siteName: "Marketplace",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body
          className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-900 antialiased`}
        >
          <SiteHeader />
          <div className="h-4 sm:h-6" />
          <main className="container min-h-[70vh] pt-8 sm:pt-16 pb-6 sm:pb-10">{children}</main>
          <div className="h-4 sm:h-6" />
          {/* <SiteFooter /> */}
        </body>
      </html>
    </ClerkProvider>
  );
}
